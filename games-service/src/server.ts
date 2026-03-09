import { getEnv } from "./env.js";
import { RawgClient } from "./lib/rawgClient.js";
import { buildApp } from "./app.js";

const env = getEnv();
const rawgClient = new RawgClient(env.RAWG_API_KEY, env.RAWG_BASE_URL);
const app = buildApp(rawgClient);

app.listen({
  host: "0.0.0.0",
  port: env.GAMES_SERVICE_PORT
}).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
