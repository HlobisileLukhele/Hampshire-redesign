const { createApp } = require("./app");
const env = require("./config/env");
const { pool } = require("./db/pool");

const app = createApp();
const server = app.listen(env.PORT, () => {
  console.log(`Hampshire server listening on port ${env.PORT}.`);
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`${signal} received. Closing server.`);

  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
