import { NodeSDK } from "@opentelemetry/sdk-node";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes  } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { metrics } from "@opentelemetry/api";

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "payment-service",
    [ATTR_SERVICE_VERSION]: "1.0.0",
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: "http://otel-collector:4318/v1/metrics" }),
    exportIntervalMillis: 5000,
  }),
  traceExporter: new OTLPTraceExporter({
    url: "http://otel-collector:4318/v1/traces",
    compression: "gzip"
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-runtime-node': {
        enabled: true,
      },
    }),
    new HttpInstrumentation(),
  ],
});

sdk.start();

const meter = metrics.getMeter("orders-service-meter");

const appLastSeen = meter.createObservableGauge("app_last_seen", {
  description: "Timestamp (epoch seconds) da última vez que o serviço esteve ativo",
});

appLastSeen.addCallback((observableResult) => {
  observableResult.observe(Math.floor(Date.now() / 1000), { service: "orders-service" });
});