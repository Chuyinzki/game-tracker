import { buildApp } from "./app.js";
import { getEnv } from "./env.js";

const env = getEnv();
const app = buildApp(env);

app.listen({
  host: "0.0.0.0",
  port: env.GATEWAY_PORT
}).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
