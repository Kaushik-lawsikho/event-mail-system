const amqp = require("amqplib");
const logger = require("./logger");
const cfg = require("./config");

let conn, channel;

async function connectRabbit() {
  try {
    conn = await amqp.connect(cfg.rabbitUrl);

    conn.on("error", (err) => {
      logger.error({ err }, "RabbitMQ connection error");
      setTimeout(connectRabbit, 5000); // reconnect after 5s
    });

    conn.on("close", () => {
      logger.warn("RabbitMQ connection closed, retrying...");
      setTimeout(connectRabbit, 5000);
    });

    channel = await conn.createChannel();
    await channel.assertExchange(cfg.exchangeEmailIntent, "topic", { durable: true });

    logger.info({ exchange: cfg.exchangeEmailIntent }, "RabbitMQ channel ready (producer)");
    return channel;
  } catch (err) {
    logger.error({ err }, "RabbitMQ connect failed, retrying...");
    setTimeout(connectRabbit, 5000);
  }
}

function getChannel() {
  if (!channel) throw new Error("RabbitMQ channel not initialized");
  return channel;
}

module.exports = { connectRabbit, getChannel };
