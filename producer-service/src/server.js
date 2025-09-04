const express = require("express");
const cfg = require("./config");
const logger = require("./logger");
const { register, publishedCounter } = require("./metrics");
const { connectRabbit } = require("./rabbit");
const { leadSchema, bookingSchema, purchaseSchema } = require("./validators");
const { publishEmailIntent } = require("./publisher");

(async function main() {
  await connectRabbit();

  const app = express();
  app.use(express.json());

  app.get("/healthz", (_req, res) => res.json({ ok: true }));
  app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  });

  app.post("/lead", async (req, res) => {
    try {
      const data = leadSchema.parse(req.body);
      const event = await publishEmailIntent("email.welcome", data);
      publishedCounter.inc({ event_type: "email.welcome" });
      res.status(202).json({ accepted: true, eventId: event.eventId });
    } catch (err) {
      logger.error({ err }, "Lead validation/publish failed");
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/booking", async (req, res) => {
    try {
      const data = bookingSchema.parse(req.body);
      const event = await publishEmailIntent("email.booking", data);
      publishedCounter.inc({ event_type: "email.booking" });
      res.status(202).json({ accepted: true, eventId: event.eventId });
    } catch (err) {
      logger.error({ err }, "Booking validation/publish failed");
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/purchase", async (req, res) => {
    try {
      const data = purchaseSchema.parse(req.body);
      const event = await publishEmailIntent("email.purchase", data);
      publishedCounter.inc({ event_type: "email.purchase" });
      res.status(202).json({ accepted: true, eventId: event.eventId });
    } catch (err) {
      logger.error({ err }, "Purchase validation/publish failed");
      res.status(400).json({ error: err.message });
    }
  });

  app.listen(cfg.port, () => logger.info({ port: cfg.port }, "Producer up"));
})();
