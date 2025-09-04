const express = require("express");
const cfg = require("./config");
const logger = require("./logger");
const { register } = require("./metrics");
const { initRabbit } = require("./rabbit");
const { init: initIdem } = require("./idempotency");
const { startConsumer } = require("./consumer");

(async function main() {
  await initRabbit();
  await initIdem(cfg.redisUrl);

  const app = express();
  app.get("/healthz", (_req, res) => res.json({ ok: true }));
  app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  });

  app.listen(cfg.port, () => logger.info({ port: cfg.port }, "Email service up"));
  startConsumer().catch((e) => {
    logger.error({ e }, "Consumer failed");
    process.exit(1);
  });
})();
