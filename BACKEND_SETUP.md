# Hampshire backend setup

The Express server serves the Hampshire pages and accepts contact enquiries at `POST /api/enquiries`. Booking remains with the HTI widget; this application does not collect booking or payment details.

## Local Docker MySQL

The repository includes a dedicated Docker Compose project named `hampshire`. It runs MySQL on `127.0.0.1:3307`, leaving port `3306` free for other local projects.

1. Set matching application credentials in `.env` (`DB_HOST=127.0.0.1`, `DB_PORT=3307`) and Docker bootstrap credentials in `.env.docker`.
2. Run `npm run db:up`.
3. Wait for the MySQL health check, then run `npm run migrate`.
4. Use `npm run db:down` to stop the local database. The `hampshire_mysql_data` volume retains data until explicitly removed.

`.env` and `.env.docker` are ignored by Git. Create `.env.docker` locally with `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_ROOT_PASSWORD`. Use a different strong password for the root account.

Adminer provides a local browser interface at `http://127.0.0.1:8080` after `npm run db:up`. Select **MySQL**, use `mysql` as the server, `hampshire_app` as the username, the `DB_PASSWORD` value from `.env`, and `hampshire_hotel` as the database.

## Hosting prerequisites

- Node.js 20 LTS or later.
- MySQL 8.0 or later, with a database and non-root application user created through the hosting control panel.
- SSL enabled between the application and MySQL when the database is remote. `DB_SSL=true` is mandatory when `NODE_ENV=production`.
- A Cloudflare Turnstile site key and secret key for each public contact-form hostname. Turnstile is mandatory when `NODE_ENV=production`.
- A reverse proxy configured to terminate HTTPS and forward only to the Node process on localhost. Do not publish MySQL, Adminer, or the Node application port directly to the internet.

Create the empty database and grant the application user only the permissions required by the application and migrations. Replace the placeholders before running this on the database host:

```sql
CREATE DATABASE hampshire_hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hampshire_app'@'APPLICATION_HOST' IDENTIFIED BY 'use-a-unique-long-password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX ON hampshire_hotel.* TO 'hampshire_app'@'APPLICATION_HOST';
FLUSH PRIVILEGES;
```

For a host that separates deployment from migrations, use a short-lived migration account with the DDL permissions (`CREATE`, `ALTER`, `INDEX`) and a runtime account with only `SELECT`, `INSERT`, and `UPDATE`.

## Configure and deploy

1. Rotate the database password previously present in repository history, then create `.env` locally. Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`, `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `SENDER_EMAIL`, and `RECIPIENT_EMAIL`. Set Turnstile keys, permitted HTTPS origin(s), and allowed public hostname(s) for production. Never commit environment files.
2. Install locked dependencies with `npm ci`.
3. Run `npm run migrate` once for each deployment that includes a new migration. This creates the enquiry deduplication table used to suppress repeated submissions.
4. Start the site with `npm start`. The host should route the Hampshire domain to this Node application.

The public contact page fetches only the Turnstile site key from `GET /api/public-config`; the Turnstile secret key remains server-only. The page must be served by this Express application (or the same API must be deployed as a serverless function) for the contact form to work.

For a VPS deployment, set `NODE_ENV=production`, `DB_SSL=true`, `TURNSTILE_ENABLED=true`, `TURNSTILE_ACTION=enquiry`, and list each exact public address in both `CONTACT_ALLOWED_ORIGINS` (including the `https://` scheme) and `TURNSTILE_ALLOWED_HOSTNAMES` (hostname only). Set `TRUST_PROXY=1` only when one managed reverse proxy is immediately in front of the application; otherwise use the exact proxy configuration supplied by the VPS portal.

The Express application deliberately serves only the pages, `/css`, `/images`, `/Images`, and `/js`. Do not configure the web server with the repository root as a separate static document root, since that would expose `server/`, migration files, and deployment configuration.

The initial migration creates `schema_migrations` and `enquiries`. Migrations are intentionally not run automatically during application startup.

## Health check

`GET /api/health` returns `200` only when MySQL can be reached. Configure the hosting health check to use this endpoint after the database credentials have been set.

## Production acceptance checks

1. Confirm the site and `/api/health` are served only over HTTPS.
2. Confirm `POST /api/enquiries` rejects a request with no approved `Origin`, a non-JSON content type, an invalid Turnstile token, a filled honeypot, and excessive repeated submissions.
3. Submit one legitimate contact enquiry and verify the database row and email notification, without logging the message body or secrets.
4. Inspect response headers for the Content Security Policy, HSTS, `X-Content-Type-Options`, clickjacking protection, referrer policy, and permissions policy.
5. Confirm URLs such as `/server/routes/enquiries.js`, `/.env`, `/compose.yaml`, and `/server/db/migrations/001_create_enquiries.sql` return 404.
6. Test the HTI booking flow separately with HTI. This website does not alter HTI transaction behaviour.
