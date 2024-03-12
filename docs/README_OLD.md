# PREVIOUS README CONTENT

Kept for reference about how this project was set up. Some of this is or will soon be outdated.

The project state before the 2024 revival including the old Docker + Travis CI/CD configs can be found at
https://github.com/TKOaly/rv-backend/tree/370e84f012785c56f85b9cb67725403e0bc61199

## Starting instructions (May 2019)

These apply if you only want to run the backend without the frontend. To run it together with frontend, check the frontend repository for instructions.

### On the first time

-   install node.js
-   install npm
-   install docker
-   add your user to the docker group
-   install docker-compose
-   install vs code
-   install plugins to vs code
-   clone backend from github
-   run npm install
-   run docker-compose up
-   run npm run db-migrate in the backend container
-   run npm run db-seed in the backend container

### Testing the backend

-   run npm test

## Old instructions below

## Local development

To run the backend locally, you can either use [Docker](https://wwww.docker.com) or run it without Docker.

### With Docker

For Docker, the repo contains a `Dockerfile` for building a Docker image of the backend server and a [Docker Compose](https://docs.docker.com/compose) file for running both the backend server and a [PostgreSQL](https://www.postgresql.org) database inside Docker.

To set up a local environment, run the following commands:

1. `docker-compose up -d --build` to build the back-end and start the service stack. Note the name of the server container, as you will need it for later steps.
2. To create database schema, run `docker exec -it <backend container name or id> npm run db-migrate`.
3. To seed database with data for development, run `docker exec -it <backend container name or id> npm run db-seed`.

By default, the server will listen on port 8080. You can use a custom [.env](.env) file to override the environment variables set by the docker-compose file. See [Configuration](#configuration) for an explanation of these variables.

To shut down the local environment, run `docker-compose down`. This will stop any containers created by docker-compose. The database image uses a persistent volume so database data will persist across service restarts and shutdowns.

Running `restart_docker.sh` restarts the service stack.

### Without Docker

To run the backend without Docker, install [Node.js](https://nodejs.org) and [PostgreSQL](https://www.postgresql.org). Then, create a database and a user in PostgreSQL for the backend to use.

Then, to run the backend server:

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

## Deployment

Generally speaking, the backend will run anywhere Docker runs or if it's run without Docker, anywhere Node.js and PostgreSQL is available.

Currently, deployment to staging and production environments in Heroku is done via Travis. Deployment to staging involves resetting and reseeding the database.

Production deployments will not automatically execute database schema changes. If a new version includes any changes to the database schema, upgrading the database needs to be coordinated with the deployment of the new server code.

## Configuration

Environment variables:

| Variable     | Description                                                                                                                                                                        |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DATABASE_URL | Address of database, e.g. `postgres://user:password@database_url:port/database`                                                                                                    |
| JWT_SECRET   | Secret key for signing JWT tokens. **Do not** use default values in production! The security of authentication will depend on this key being kept secret, so treat it accordingly. |
| PORT         | Port used by the backend server                                                                                                                                                    |
| NODE_ENV     | Environment for Node, can be one of `development`, `test` or `production`.                                                                                                         |

## Testing practices

When developing, create tests for created endpoints and when felt useful. Use Mocha to write tests and mocking.

## Using REST client with VSCode

### Admin routes

1. Install REST client for VSCode
2. Use `admin_auth.rest` to get your JWT
3. Add the following to your VSCode config, replacing TOKEN:

```json
"rest-client.environmentVariables": {
        "$shared": {
            "rv_backend_admin_token": "TOKEN"
        }
    }
```

4. You can now use REST client to make requests to the management 'back end.

### Normal routes

1. Install REST client for VSCode
2. Use `user_auth.rest` to get your JWT
3. Add the following to your VSCode config, replacing TOKEN:

```json
"rest-client.environmentVariables": {
        "$shared": {
            "rv_backend_user_token": "TOKEN"
        }
    }
```

4. You can now use REST client to make requests to the back end.

## API

### Authentication

The service uses [JWT tokens](https://jwt.io) for authenticating HTTP requests. All authenticated endpoints require that you include your JWT token in the request headers. The token should be included in the `Authorization` header, e.g. `Authorization: Bearer <JWT token here>`.

### Endpoints

A full list of API endpoints and their documentation can be found at
[Swagger](https://app.swaggerhub.com/apis-docs/TKOaly/Ruokavalitys/1.1#/).
This documentation is created from an OpenAPI description of the API,
which can be found from the file `openapi.yaml`.
