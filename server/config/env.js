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
  CONTACT_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(100).default(5),
  CONTACT_EMAIL_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().min(1).max(1440).default(60),
  CONTACT_EMAIL_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(100).default(3),
  CONTACT_DEDUPLICATION_WINDOW_MINUTES: z.coerce.number().int().min(1).max(1440).default(10),
  TURNSTILE_ENABLED: booleanFromEnvironment.default(false),
  TURNSTILE_SITE_KEY: z.string().trim().default(""),
  TURNSTILE_SECRET_KEY: z.string().trim().default(""),
  TURNSTILE_ALLOWED_HOSTNAMES: z
    .string()
    .default("")
    .transform((value) => value.split(",").map((hostname) => hostname.trim().toLowerCase()).filter(Boolean)),
  MS_TENANT_ID: z.string().trim().min(1, "MS_TENANT_ID is required"),
  MS_CLIENT_ID: z.string().trim().min(1, "MS_CLIENT_ID is required"),
  MS_CLIENT_SECRET: z.string().min(1, "MS_CLIENT_SECRET is required"),
  SENDER_EMAIL: z.string().trim().email("SENDER_EMAIL must be a valid email address"),
  RECIPIENT_EMAIL: z.string().trim().email("RECIPIENT_EMAIL must be a valid email address")
}).superRefine((environment, context) => {
  if (environment.NODE_ENV !== "production") {
    return;
  }

  if (!environment.DB_SSL) {
    context.addIssue({
      code: "custom",
      path: ["DB_SSL"],
      message: "DB_SSL must be true in production."
    });
  }

  if (!environment.TURNSTILE_ENABLED) {
    context.addIssue({
      code: "custom",
      path: ["TURNSTILE_ENABLED"],
      message: "TURNSTILE_ENABLED must be true in production."
    });
  }

  if (environment.TURNSTILE_ENABLED && !environment.TURNSTILE_SITE_KEY) {
    context.addIssue({
      code: "custom",
      path: ["TURNSTILE_SITE_KEY"],
      message: "TURNSTILE_SITE_KEY is required when Turnstile is enabled."
    });
  }

  if (environment.TURNSTILE_ENABLED && !environment.TURNSTILE_SECRET_KEY) {
    context.addIssue({
      code: "custom",
      path: ["TURNSTILE_SECRET_KEY"],
      message: "TURNSTILE_SECRET_KEY is required when Turnstile is enabled."
    });
  }

  if (environment.TURNSTILE_ENABLED && environment.TURNSTILE_ALLOWED_HOSTNAMES.length === 0) {
    context.addIssue({
      code: "custom",
      path: ["TURNSTILE_ALLOWED_HOSTNAMES"],
      message: "TURNSTILE_ALLOWED_HOSTNAMES must list the public form hostname(s) in production."
    });
  }
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  const problems = parsedEnvironment.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment configuration: ${problems}`);
}

module.exports = Object.freeze(parsedEnvironment.data);
