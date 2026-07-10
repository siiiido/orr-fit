# Database Backup Design

## Overview
A scheduled automated workflow to back up the Supabase database for the `orr-fit` project weekly without incurring extra costs.

## Architecture & Trigger
- **Scheduler**: GitHub Actions `schedule` trigger using cron syntax (`0 0 * * 0` - 00:00 UTC every Sunday).
- **Environment**: GitHub-hosted `ubuntu-latest` runner.

## Data Extraction
- **Tool**: PostgreSQL native client `pg_dump` (pre-installed on ubuntu-latest).
- **Method**: The runner uses the `pg_dump` command directly to connect to the remote Supabase PostgreSQL database.
- **Output**: A `.sql` file containing both the database schema and data (`--clean --if-exists --no-owner --no-privileges --quote-all-identifiers`).

## Storage
- **Mechanism**: GitHub Actions Artifacts using the `actions/upload-artifact@v4` action.
- **Retention**: 90 days (default limit for public/free repo artifacts).
- **File Naming**: `orr-fit-db-backup-<YYYY-MM-DD>.sql`.

## Security
- **Credentials**: The PostgreSQL connection string will be provided via a GitHub Repository Secret named `SUPABASE_DB_URL`.
- **Connection URI**: The user will obtain the transaction connection string from the Supabase dashboard and add it to the repository secrets. The URL contains the password and must not be logged.
