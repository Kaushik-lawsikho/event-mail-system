const { getChannel } = require("./rabbit");
const cfg = require("./config");
const logger = require("./logger");
const { sendMail } = require("./mailer");
const { consumedCounter, sentCounter, failedCounter, retriedCounter, dlqCounter, processingTime } = require("./metrics");
const { checkAndLock } = require("./idempotency");

function computeRetry(next) {
  // simple backoff using constant 30s delay queue; count controls when to DLQ
  return { routingKey: "delay.30s" };
}

async function handleEvent(msg) {
  const ch = getChannel();
  const headers = msg.properties.headers || {};
  const retryCount = (headers["x-retry-count"] || 0);
  const event = JSON.parse(msg.content.toString());
  const type = event.type;

  consumedCounter.inc({ event_type: type });
  const endTimer = processingTime.startTimer({ event_type: type });

  try {
    // idempotency
    const messageId = msg.properties.messageId || event.eventId;
    const firstTime = await checkAndLock(messageId, 24 * 3600);
    if (!firstTime) {
      logger.warn({ messageId }, "Duplicate message suppressed");
      ch.ack(msg);
      endTimer();
      return;
    }

    // route to template
    if (type === "email.welcome") {
      await sendMail({
        to: event.payload.email,
        subject: "Welcome!",
        templateName: "welcome",
        templateData: { name: event.payload.name, source: event.payload.source || "website" }
      });
    } else if (type === "email.booking") {
      await sendMail({
        to: event.payload.email,
        subject: "Your booking is confirmed",
        templateName: "booking-confirmation",
        templateData: { name: event.payload.name, bookingId: event.payload.bookingId, date: event.payload.date }
      });
    } else if (type === "email.purchase") {
      // You can add purchase templates similarly
      await sendMail({
        to: event.payload.email,
        subject: "Thanks for your purchase",
        templateName: "welcome", // placeholder: create a purchase.hbs in real usage
        templateData: { name: event.payload.name, source: "checkout" }
      });
    } else {
      throw new Error(`Unsupported event type: ${type}`);
    }

    sentCounter.inc({ event_type: type });
    getChannel().ack(msg);
    endTimer();

  } catch (err) {
    logger.error({ err, type, retryCount }, "Processing failed");
    failedCounter.inc({ event_type: event.type, phase: "send" });

    if (retryCount < cfg.maxRetries) {
      // Publish to retry exchange with incremented header
      const next = computeRetry(retryCount + 1);
      getChannel().publish(
        cfg.exchanges.retry,
        next.routingKey,
        msg.content,
        {
          persistent: true,
          contentType: "application/json",
          messageId: msg.properties.messageId,
          headers: {
            ...msg.properties.headers,
            "x-retry-count": retryCount + 1
          }
        }
      );
      retriedCounter.inc({ event_type: event.type });
      getChannel().ack(msg); // ack original after we schedule retry
    } else {
      // Move to DLQ by publishing explicitly (or nack without requeue if DLX wired)
      getChannel().publish(cfg.exchanges.dlq, "", msg.content, {
        persistent: true,
        contentType: "application/json",
        messageId: msg.properties.messageId,
        headers: { ...msg.properties.headers, "x-dead-letter": true }
      });
      dlqCounter.inc({ event_type: event.type });
      getChannel().ack(msg);
    }
  }
}

async function startConsumer() {
  const ch = getChannel();
  await ch.prefetch(cfg.prefetch);
  await ch.consume(cfg.queues.intent, handleEvent, { noAck: false });
  logger.info({ queue: cfg.queues.intent, prefetch: cfg.prefetch }, "Consuming…");
}

module.exports = { startConsumer };
