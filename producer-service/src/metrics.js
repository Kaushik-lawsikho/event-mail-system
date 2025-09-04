const client = require("prom-client");

const Registry = client.Registry;
const register = new Registry();
client.collectDefaultMetrics({ register });

const publishedCounter = new client.Counter({
  name: "producer_events_published_total",
  help: "Total events published to RabbitMQ",
  labelNames: ["event_type"]
});
register.registerMetric(publishedCounter);

module.exports = { register, publishedCounter };
