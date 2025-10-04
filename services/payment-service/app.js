require("./otel-config");
const express = require("express");
const pino = require("pino");
const pinoHttp = require("pino-http");
const ecsFormat = require("@elastic/ecs-pino-format");

const logger = pino({ level: "info", ...ecsFormat(), base: null });
const loggingMiddleware = pinoHttp({ logger });
const app = express();
app.use(express.json());
app.use(loggingMiddleware);

app.post("/payment", (req, res) => {
  logger.info({ msg: "Processing payment", orderId: req.body.orderId, amount: req.body.amount });
  res.json({ status: "paid", orderId: req.body.orderId });
});

app.listen(3002, () => logger.info("Payment service running on port 3002"));
