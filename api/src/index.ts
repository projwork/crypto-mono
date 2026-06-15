import { createApp } from "./app.js";
import { config } from "./config/index.js";

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`[api] listening on http://localhost:${config.port} (${config.env})`);
  console.log(`[api] health:  http://localhost:${config.port}/health`);
});

const shutdown = (signal: string) => {
  console.log(`\n[api] received ${signal}, shutting down...`);
  server.close(() => {
    console.log("[api] closed.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
