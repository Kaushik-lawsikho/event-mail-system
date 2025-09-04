const { v4: uuidv4 } = require("uuid");
const cfg = require("./config");
const logger = require("./logger");
const { getChannel } = require("./rabbit");

function baseEvent(type, payload) {
  return {
    eventId: uuidv4(),
    type,                            // e.g., "email.welcome", "email.booking"
    source: "producer-service",
    timestamp: new Date().toISOString(),
    payload
  };
}

async function publishEmailIntent(routingKey, payload) {
  const ch = getChannel();
  const event = baseEvent(routingKey, payload);

  const ok = ch.publish(
    cfg.exchangeEmailIntent,
    routingKey,
    Buffer.from(JSON.stringify(event)),
    {
      persistent: true,
      contentType: "application/json",
      messageId: event.eventId,
      headers: {
        "x-idempotency-key": event.eventId,
        "x-retry-count": 0
      }
    }
  );
  if (!ok) logger.warn({ routingKey }, "Backpressure: publish returned false");
  return event;
}

module.exports = { publishEmailIntent };
