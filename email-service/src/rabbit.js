const amqp = require("amqplib");
const logger = require("./logger");
const cfg = require("./config");

let conn, ch;

async function initRabbit() {
  conn = await amqp.connect(cfg.rabbitUrl);
  ch = await conn.createChannel();

  // Exchanges
  await ch.assertExchange(cfg.exchanges.intent, "topic", { durable: true });
  await ch.assertExchange(cfg.exchanges.retry, "direct", { durable: true });
  await ch.assertExchange(cfg.exchanges.dlq, "fanout", { durable: true });

  // Main queue (bind to all email.* routing keys)
  await ch.assertQueue(cfg.queues.intent, {
    durable: true,
    // If a consumer nacks without requeue, message will go here:
    deadLetterExchange: cfg.exchanges.dlq
  });
  await ch.bindQueue(cfg.queues.intent, cfg.exchanges.intent, "email.*");

  // Retry queue (30s) -> dead-letter back to main exchange with original routing key
  await ch.assertQueue(cfg.queues.retry30s, {
    durable: true,
    messageTtl: 30000, // 30s delay
    deadLetterExchange: cfg.exchanges.intent
  });
  await ch.bindQueue(cfg.queues.retry30s, cfg.exchanges.retry, "delay.30s");

  // DLQ
  await ch.assertQueue(cfg.queues.dlq, { durable: true });
  await ch.bindQueue(cfg.queues.dlq, cfg.exchanges.dlq, "");

  logger.info("RabbitMQ ready (email-service)");
  return ch;
}

function getChannel() {
  if (!ch) throw new Error("RabbitMQ channel not initialized");
  return ch;
}

module.exports = { initRabbit, getChannel };
