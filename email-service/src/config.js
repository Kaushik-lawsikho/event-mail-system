require("dotenv").config();

const cfg = {
  port: parseInt(process.env.PORT || "3002", 10),
  rabbitUrl: process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672",
  exchanges: {
    intent: process.env.EXCHANGE_EMAIL_INTENT || "email.intent",
    retry: process.env.EXCHANGE_EMAIL_RETRY || "email.retry",
    dlq: process.env.EXCHANGE_EMAIL_DLQ || "email.dlq",
  },
  queues: {
    intent: process.env.QUEUE_EMAIL_INTENT || "email.intent.queue",
    retry30s: process.env.QUEUE_EMAIL_RETRY_30S || "email.retry.30s",
    dlq: process.env.QUEUE_EMAIL_DLQ || "email.dlq.queue",
  },
  prefetch: parseInt(process.env.PREFETCH || "10", 10),
  maxRetries: parseInt(process.env.MAX_RETRIES || "5", 10),

  smtp: {
    host: process.env.SMTP_HOST || "localhost",
    port: parseInt(process.env.SMTP_PORT || "1025", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: (process.env.SMTP_USER && process.env.SMTP_PASS) ? {
      user: process.env.SMTP_USER, pass: process.env.SMTP_PASS
    } : undefined
  },

  redisUrl: process.env.REDIS_URL || null,
};

module.exports = cfg;
