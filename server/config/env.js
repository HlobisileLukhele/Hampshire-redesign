const path = require("node:path");
const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config({ path: path.resolve(process.cwd(), ".env"), quiet: true });

const booleanFromEnvironment = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
  DB_HOST: z.string().trim().min(1, "DB_HOST is required"),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(3306),
  DB_NAME: z.string().trim().min(1, "DB_NAME is required"),
  DB_USER: z.string().trim().min(1, "DB_USER is required"),
  DB_PASSWORD: z.string().min(1, "DB_PASSWORD is required"),
  DB_SSL: booleanFromEnvironment.default(false),
  DB_CONNECTION_LIMIT: z.coerce.number().int().min(1).max(20).default(5),
  CONTACT_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
  CONTACT_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(100).default(5)
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  const problems = parsedEnvironment.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment configuration: ${problems}`);
}

module.exports = Object.freeze(parsedEnvironment.data);
