require("./otel-config");
const express = require("express");
const { trace, context } = require("@opentelemetry/api");
const pino = require("pino");
const pinoHttp = require("pino-http");
const ecsFormat = require("@elastic/ecs-pino-format");
const promBundle = require('express-prom-bundle');

const logger = pino({
  level: "info",
  ...ecsFormat(),
  base: null,
});

const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  autoregister: true,
  promClient: {
    collectDefaultMetrics: {},
  },
  normalizePath: [
    [/^\/metrics$/, '/metrics'], 
    [/^\/order\/[^\/]+$/, '/order/:id']
  ],
});

const loggingMiddleware = pinoHttp({
  logger,
  customLogLevel: (res, err) => (err || res.statusCode >= 400 ? "error" : "info"),
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: req.headers,
    }),
  },
  genReqId: (req) => {
    const span = trace.getSpan(context.active());
    if (span) {
      const spanContext = span.spanContext();
      req.traceId = spanContext.traceId;
      req.spanId = spanContext.spanId;
      return spanContext.traceId;
    }
    return undefined;
  },
  customProps: (req, res) => ({
    traceId: req.traceId,
    spanId: req.spanId,
  }),
});

const app = express();
app.use(metricsMiddleware);
app.use(loggingMiddleware);

app.get("/order/:id", (req, res) => {
  req.log.info({ msg: "Fetching order", orderId: req.params.id });
  res.json({ orderId: req.params.id, status: "confirmed" });
});

app.get("/simulate-error", (req, res) => {
  req.log.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal Server Error" });
});

app.get('/metrics', (req, res) => {
  res.set('Content-Type', metricsMiddleware.promClient.register.contentType);
  res.send(metricsMiddleware.promClient.register.metrics());
});

app.listen(3000, () => {
  logger.info("Orders service running on port 3000");
});
