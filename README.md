![RV](https://raw.githubusercontent.com/TKOaly/rv-management-frontend/main/public/rv-icon.png)

# Ruokavälitys-backend

[![.github/workflows/node.yml](https://github.com/TKOaly/rv-backend/actions/workflows/node.yml/badge.svg?branch=develop)](https://github.com/TKOaly/rv-backend/actions/workflows/node.yml)
[![codecov](https://codecov.io/gh/TKOaly/rv-backend/branch/develop/graph/badge.svg)](https://app.codecov.io/gh/TKOaly/rv-backend)

Backend for new TKO-äly Ruokavälitys (Snack kiosk)

#### Serves the following frontends:

-   [rv-tui-frontend](https://github.com/TKOaly/rv-tui-frontend) (React based TUI interface)
-   [rv-management-frontend](https://github.com/TKOaly/rv-management-frontend) (NextJS based web interface)
-   [rv-app-frontend](https://github.com/TKOaly/rv-app-frontend) (Old touch supported web interface)
-   [rv-old-management-frontend](https://github.com/TKOaly/rv-old-management-frontend) (Deprecated)

## Table Of Contents

-   [Prerequisites](#prerequisites)
-   [Docker Setup](#docker-setup)
-   [Local Setup](#local-setup-without-docker)
-   [Configuration](#configuration)
-   [API](#api)

## Prerequisites

<sub>Expand sections for more info</sub>

<details>
<summary>Install node & npm</summary>

-   easiest with [nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#calling-nvm-use-automatically-in-a-directory-with-a-nvmrc-file)
-   see [nvm docs](https://github.com/nvm-sh/nvm?tab=readme-ov-file#calling-nvm-use-automatically-in-a-directory-with-a-nvmrc-file) to have your shell switch automatically to the version specified in .nvmrc
-   frontend and backend repos may use different node versions

</details>
<details>
<summary>Install Docker</summary>
  
  - add your user to the docker group 
    - may require a restart
  - Install docker-compose

</details>
<details open>
<summary> Install IDE plugins  </summary>

-   Recommended
    -   Biome
-   Useful
    -   an OpenAPI spec viewer
    -   [REST client](docs/REST_CLIENT.md)

</details>
</br>

Intallation instructions apply for running the project backend. To run the frontends check the respective frontend repositories [listed above](#serves-the-following-frontends) for instructions.

## Docker Setup

### installation

```bash
git clone git@github.com:TKOaly/rv-backend.git
cd rv-backend
npm install
cp .env.example .env
npm run start-container
npm run recreate-container-db
```

By default, the server will listen on port 4040. See [Configuration](#configuration) for more.

To rebuild the environment and reset the database run `npm run recreate-container`

To shutdown the enviroment run `docker-compose down`. The database image uses a persistent volume so data will persist across service restarts.

<details>
<summary>
Detailed container setup process <sup>[expand]</sup>
</summary>

##### Build backend and start container

```bash
docker-compose up -d --build
```

##### Rollback existing database (optional)

```bash
docker exec -it rv-backend-rv-backend-1 npm run db-rollback
```

##### Create database schema

```bash
docker exec -it rv-backend-rv-backend-1 npm run db-migrate
```

##### Add insert seed data to database

```bash
docker exec -it rv-backend-rv-backend-1 npm run db-seed
```

</details>

### Testing

```bash
npm run start-container
npm run test-container
```

## Local Setup without Docker

### Prerequisites

Install [PostgreSQL](https://www.postgresql.org) and create a database and a user for the backend to use.

### Installations

1. Run `npm install` to install packages needed by the backend server.
2. Set environment variables:
    - `DATABASE_URL` is used by the backend to connect to a database server. For example, if your local database is running on port 5432 with user `user` and password `password` and database `db`, the value would be `postgres://user:password@localhost:5432/db`.
    - `JWT_SECRET` is used to sign authentication tokens issued by the server. This can be any string.
    - `PORT` is the port the backend server listens on.
    - Setting `NODE_ENV` is optional since it defaults to `development` but you can set it if you want try out environments other than development.
3. If needed, clear database by running `npm run db-rollback`.
4. Run `npm run db-migrate` to create or update the database schema to the latest version.
5. Run `npm run db-seed` to seed the database with initial data.
6. Finally, run `npm start-nodemon` to start the server. [Nodemon](https://github.com/remy/nodemon) will listen for changes in code and restart the server if necessary.

## Configuration

You can use a custom [.env](.env) file to override the environment variables set by the docker-compose file.

| Environment Variable                          | Description                                                                                                                                                                         |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB | Postgres database configuration                                                                                                                                                     |
| JWT_SECRET, JWT_ADMIN_SECRET                  | Secret keys for signing JWT tokens. **Do not** use default values in production! The security of authentication will depend on this key being kept secret, so treat it accordingly. |
| PORT                                          | Port the backend is served at                                                                                                                                                       |
| NODE_ENV                                      | Environment for Node, can be one of `development`, `test` or `production`.                                                                                                          |

## API

### Authentication

The service uses [JWT tokens](https://jwt.io) for authenticating HTTP requests. All authenticated endpoints require that you include your JWT token in the request headers. The token should be included in the `Authorization` header, e.g. `Authorization: Bearer <JWT token here>`.

### Endpoints

A full list of API endpoints and their documentation can be found at
[Swagger](https://app.swaggerhub.com/apis-docs/TKOaly/Ruokavalitys/1.1#/).
This documentation is created from an OpenAPI description of the API,
which can be found from the file `openapi.yaml`. The OpenApi spec is also used for request validation with middleware
