require("dotenv").config();

const cfg = {
  port: parseInt(process.env.PORT || "3001", 10),
  rabbitUrl: process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672",
  exchangeEmailIntent: process.env.EXCHANGE_EMAIL_INTENT || "email.intent",
};

for (const [k, v] of Object.entries(cfg)) {
  if (v === undefined || v === null || v === "") {
    throw new Error(`Missing config: ${k}`);
  }
}

module.exports = cfg;
