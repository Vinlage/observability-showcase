require("./otel-config");
const express = require("express");
const { diag, DiagConsoleLogger, DiagLogLevel } = require("@opentelemetry/api");

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const app = express();

app.get("/order/:id", (req, res) => {
  console.log(JSON.stringify({ level: "info", msg: "Fetching order", orderId: req.params.id }));
  res.json({ orderId: req.params.id, status: "confirmed" });
});

app.listen(3000, () => {
  console.log("Orders service running on port 3000");
});