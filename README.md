![RV](https://raw.githubusercontent.com/TKOaly/rv-management-frontend/main/public/rv-icon.png)

# Ruokavälitys-backend

[![.github/workflows/node.yml](https://github.com/TKOaly/rv-backend/actions/workflows/node.yml/badge.svg?branch=develop)](https://github.com/TKOaly/rv-backend/actions/workflows/node.yml)
[![codecov](https://codecov.io/gh/TKOaly/rv-backend/branch/develop/graph/badge.svg)](https://app.codecov.io/gh/TKOaly/rv-backend)

Backend service for the new TKO-äly Ruokavälitys (Snack kiosk)

## Forked Version

This repository is a fork of the [TKOaly/rv-backend](https://github.com/tkoaly/rv-backend/) project. In this version, the software is updated as part of the Ohtu project (spring 2025), incorporating changes and enhancements tailored to its specific goals.

#### Serves the following frontends:

-   [rv-tui-frontend](https://github.com/TKOaly/rv-tui-frontend) (React based TUI interface)
-   [rv-management-frontend](https://github.com/TKOaly/rv-management-frontend) (NextJS based web interface)
-   [rv-app-frontend](https://github.com/TKOaly/rv-app-frontend) (Legacy touch-supported web UI)
-   [rv-old-management-frontend](https://github.com/TKOaly/rv-old-management-frontend) (Deprecated)

## Table Of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Docker Setup](#docker-setup)
  - [Local Setup (without Docker)](#local-setup-without-docker)
- [Configuration](#configuration)
- [API](#api)

## Prerequisites

- **Node.js** (>=16.x LTS) and **npm** 
- **Docker** 
- Recommended IDE plugins:
  - [Biome](https://biomejs.dev/)
  - OpenAPI spec viewer
  - REST client (e.g. VS Code REST Client)

> Installation instructions apply to the backend only. Please refer to frontend repo for its own setup.

---

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Ruokavalitys/rv-update-backend.git
cd rv-update-backend
npm install
npm run start-container
npm run recreate-container-db
```

## Docker Setup

Build and run all services:

```bash
docker compose up -d --build
```
Initialize the database (migrations & seed):

```bash
docker compose exec rv-update-backend-server npm run db-migrate
docker compose exec rv-update-backend-server npm run db-seed
```

Stop and remove containers:

```bash
docker compose down
```

The database image uses a persistent volume so data will persist across service restarts.

By default, the server will listen on port 4040. See [Configuration](#configuration) for more.

To rebuild the environment and reset the database: 

```bash
npm run recreate-container
```

### Testing

```bash
npm run test-container
```

## Local Setup (without Docker)

### Prerequisites

1. Ensure [PostgreSQL](https://www.postgresql.org) is installed and running; create a database and user.


2. Install project dependencies:

```bash
npm install
```

3. Set environment variables:
    - `DATABASE_URL` is used by the backend to connect to a database server. For example, if your local database is running on port 5432 with user `user` and password `password` and database `db`, the value would be `postgres://user:password@localhost:5432/db`.
    - `JWT_SECRET` is used to sign authentication tokens issued by the server. This can be any string.
    - `PORT` is the port the backend server listens on.
    - Setting `NODE_ENV` is optional since it defaults to `development` but you can set it if you want try out environments other than development.

4. If needed, clear database:

```bash
npm run db-rollback
```

5. Run migrations and seed data:

```bash
npm run build
```

```bash
npm run db-migrate
npm run db-seed
```

6. Start the server:

```bash
npm start-nodemon
```

 [Nodemon](https://github.com/remy/nodemon) will listen for changes in code and restart the server if necessary.

## Configuration

You can use a custom [.env](.env) file to override the environment variables set by the docker-compose file.

| Environment Variable                          | Description                                                                                                                                                                         |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB | Postgres database configuration                                                                                                                                                     |
| JWT_SECRET                 | Secret keys for signing JWT tokens. **Do not** use default values in production! The security of authentication will depend on this key being kept secret, so treat it accordingly. |
| PORT                                          | Port the backend is served at                                                                                                                                                       |
| NODE_ENV                                      | Environment for Node, can be one of `development`, `test` or `production`.                                                                                                          |

## API

### Authentication

The service uses [JWT tokens](https://jwt.io) for authenticating HTTP requests. All authenticated endpoints require that you include your JWT token in the request headers. The token should be included in the `Authorization` header, e.g. `Authorization: Bearer <JWT token here>`.

### Documentation

- OpenAPI spec: `openapi.yaml`
- [Swagger UI](https://app.swaggerhub.com/apis-docs/TKOaly/Ruokavalitys/1.1#/)
