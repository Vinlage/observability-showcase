require("./otel-config");
const express = require("express");
const { trace, context } = require("@opentelemetry/api");
const pino = require("pino");
const pinoHttp = require("pino-http");
const ecsFormat = require("@elastic/ecs-pino-format");

const logger = pino({
  level: "info",
  ...ecsFormat(),
  base: null,
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
app.use(loggingMiddleware);

app.get("/order/:id", (req, res) => {
  req.log.info({ msg: "Fetching order", orderId: req.params.id });
  res.json({ orderId: req.params.id, status: "confirmed" });
});

app.get("/simulate-error", (req, res) => {
  const err = new Error("Simulated internal server error");
  req.log.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(3000, () => {
  logger.info("Orders service running on port 3000");
});
