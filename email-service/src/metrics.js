const client = require("prom-client");
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const consumedCounter = new client.Counter({
  name: "email_events_consumed_total", help: "Total events consumed", labelNames: ["event_type"]
});
const sentCounter = new client.Counter({
  name: "emails_sent_total", help: "Total emails sent", labelNames: ["event_type"]
});
const failedCounter = new client.Counter({
  name: "emails_failed_total", help: "Total email sends failed", labelNames: ["event_type", "phase"] // phase = render|send
});
const retriedCounter = new client.Counter({
  name: "email_retries_total", help: "Total retries published", labelNames: ["event_type"]
});
const dlqCounter = new client.Counter({
  name: "email_dlq_total", help: "Total events moved to DLQ", labelNames: ["event_type"]
});
const processingTime = new client.Histogram({
  name: "email_processing_seconds", help: "Email processing time (s)", labelNames: ["event_type"], buckets: [0.05,0.1,0.2,0.5,1,2,5]
});

register.registerMetric(consumedCounter);
register.registerMetric(sentCounter);
register.registerMetric(failedCounter);
register.registerMetric(retriedCounter);
register.registerMetric(dlqCounter);
register.registerMetric(processingTime);

module.exports = { register, consumedCounter, sentCounter, failedCounter, retriedCounter, dlqCounter, processingTime };
