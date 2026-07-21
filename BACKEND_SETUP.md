# Hampshire backend setup

The Express server serves the Hampshire pages and accepts contact enquiries at `POST /api/enquiries`. Booking remains with the HTI widget; this application does not collect booking or payment details.

## Local Docker MySQL

The repository includes a dedicated Docker Compose project named `hampshire`. It runs MySQL on `127.0.0.1:3307`, leaving port `3306` free for other local projects.

1. Set matching application credentials in `.env` (`DB_HOST=127.0.0.1`, `DB_PORT=3307`) and Docker bootstrap credentials in `.env.docker`.
2. Run `npm run db:up`.
3. Wait for the MySQL health check, then run `npm run migrate`.
4. Use `npm run db:down` to stop the local database. The `hampshire_mysql_data` volume retains data until explicitly removed.

`.env.docker` is ignored by Git. Use `.env.docker.example` as the safe template.

Adminer provides a local browser interface at `http://127.0.0.1:8080` after `npm run db:up`. Select **MySQL**, use `mysql` as the server, `hampshire_app` as the username, the `DB_PASSWORD` value from `.env`, and `hampshire_hotel` as the database.

## Hosting prerequisites

- Node.js 20 LTS or later.
- MySQL 8.0 or later, with a database and non-root application user created through the hosting control panel.
- SSL enabled between the application and MySQL when the database is remote.

Create the empty database and grant the application user only the permissions required by the application and migrations. Replace the placeholders before running this on the database host:

```sql
CREATE DATABASE hampshire_hotel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hampshire_app'@'APPLICATION_HOST' IDENTIFIED BY 'use-a-unique-long-password';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX ON hampshire_hotel.* TO 'hampshire_app'@'APPLICATION_HOST';
FLUSH PRIVILEGES;
```

For a host that separates deployment from migrations, use a short-lived migration account with the DDL permissions (`CREATE`, `ALTER`, `INDEX`) and a runtime account with only `SELECT`, `INSERT`, and `UPDATE`.

## Configure and deploy

1. Copy `.env.example` to `.env`, enter the database credentials, and never commit `.env`.
2. Install locked dependencies with `npm ci`.
3. Run `npm run migrate` once for each deployment that includes a new migration.
4. Start the site with `npm start`. The host should route the Hampshire domain to this Node application.

The initial migration creates `schema_migrations` and `enquiries`. Migrations are intentionally not run automatically during application startup.

## Health check

`GET /api/health` returns `200` only when MySQL can be reached. Configure the hosting health check to use this endpoint after the database credentials have been set.
