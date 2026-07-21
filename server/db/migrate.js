const fs = require("node:fs/promises");
const path = require("node:path");
const { pool } = require("./pool");

const migrationsDirectory = path.join(__dirname, "migrations");

async function getMigrationFiles() {
  const entries = await fs.readdir(migrationsDirectory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && /^\d{3}_.+\.sql$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

async function runMigrations() {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name VARCHAR(255) NOT NULL PRIMARY KEY,
        applied_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [appliedMigrations] = await connection.query(
      "SELECT name FROM schema_migrations ORDER BY name"
    );
    const appliedNames = new Set(appliedMigrations.map((migration) => migration.name));
    const migrationFiles = await getMigrationFiles();

    for (const fileName of migrationFiles) {
      if (appliedNames.has(fileName)) {
        continue;
      }

      const migrationPath = path.join(migrationsDirectory, fileName);
      const sql = (await fs.readFile(migrationPath, "utf8")).trim();

      if (!sql) {
        throw new Error(`Migration ${fileName} is empty`);
      }

      console.log(`Applying migration: ${fileName}`);
      await connection.query(sql);
      await connection.execute(
        "INSERT INTO schema_migrations (name) VALUES (?)",
        [fileName]
      );
    }

    console.log("Database migrations are up to date.");
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

runMigrations().catch((error) => {
  console.error("Database migration failed:", error.message);
  process.exitCode = 1;
});
