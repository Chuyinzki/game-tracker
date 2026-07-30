import { buildApp } from "./app.js";
import { getEnv } from "./env.js";
import { startEventConsumer } from "./lib/rabbitmq.js";

const env = getEnv();
const app = buildApp();

await startEventConsumer(app, env.RABBITMQ_URL);

app.listen({
  host: "0.0.0.0",
  port: env.EVENTS_SERVICE_PORT
}).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
