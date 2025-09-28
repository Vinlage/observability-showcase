const opentelemetry = require("@opentelemetry/sdk-node");
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");
const { OTLPMetricExporter } = require("@opentelemetry/exporter-metrics-otlp-http");

const sdk = new opentelemetry.NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: "http://jaeger:4318/v1/traces" }),
  metricExporter: new OTLPMetricExporter({ url: "http://prometheus:9090/metrics" }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();