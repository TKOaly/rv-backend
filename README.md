# rv-backend [![Build Status](https://travis-ci.org/ohtu2018-rv/rv-backend.svg?branch=develop)](https://travis-ci.org/ohtu2018-rv/rv-backend)

RV backend

[Staging](https://rv-backend-dev.herokuapp.com)

[Production](https://rv-backend.herokuapp.com)

## Local development

To run the backend locally, you can either use [Docker](https://wwww.docker.com) or run it without Docker. 

### With Docker

For Docker, the repo contains a `Dockerfile` for building a Docker image of the backend server and a [Docker Compose](https://docs.docker.com/compose) file for running both the backend server and a [PostgreSQL](https://www.postgresql.org) database inside Docker.

To set up a local environment, run the following commands:

1. `docker-compose build` to build Docker images for the backend and database.
2. `docker-compose up -d db` to start the PostgreSQL database. Give it a few seconds to start up before continuing.
3. `docker-compose up -d rv-backend` to start the backend server.

By default, the server will listen on port 8081. See [.env](.env) for default configuration and [Configuration](#configuration) for an explanation of these variables.

To shut down the local environment, run `docker-compose down`. This will stop and remove any containers created by Docker Compose.

On linux `sudo ./restart.sh` restarts a running docker.

### Without Docker

To run the backend without Docker, install [Node.js](https://nodejs.org) and [PostgreSQL](https://www.postgresql.org). Then, create a database and a user in PostgreSQL for the backend to use.

Then, to run the backend server:

1. Run `npm install` to install packages needed by the backend server.
2. Set environment variables:
    * `DATABASE_URL` is used by the backend to connect to a database server. For example, if your local database is running on port 5432 with user `user` and password `password` and database `db`, the value would be `postgres://user:password@localhost:5432/db`.
    * `JWT_SECRET` is used to sign authentication tokens issued by the server. This can be any string. 
    * `PORT` is the port the backend server listens on.
    * Setting `NODE_ENV` is optional since it defaults to `development` but you can set it if you want try out environments other than development.
3. Run `./node_modules/knex/bin/cli.js migrate:latest` to create or update the database schema to the latest version.
4. Run `./node_modules/knex/bin/cli.js seed:run` to seed the database with initial data.
5. Finally, run `npm start` to start the server.

## Deployment

Generally speaking, the backend will run anywhere Docker runs or if it's run without Docker, anywhere Node.js and PostgreSQL is available.

Deploying to [Heroku](https://www.heroku.com) is probably the easiest, since Heroku supports Docker containers and provides a [PostgreSQL addon](https://devcenter.heroku.com/articles/heroku-postgresql). Note that Heroku will automatically set the `DATABASE_URL` and `PORT` environment variables so these don't have to be set manually.

## Configuration

Environment variables:

| Variable  | Description |
| ------------- | ------------- |
| DATABASE_URL  | Address of database, e.g. `postgres://user:password@database_url:port/database` |
| JWT_SECRET  | Secret key for signing JWT tokens. **Do not** use default values in production! |
| PORT | Port used by the backend server |
| NODE_ENV | Environment for Node, can be one of `development`, `test` or `production`. |

## API

### Authentication

The service uses [JWT tokens](https://jwt.io) for authenticating HTTP requests. All authenticated endpoints require that you include your JWT token in the request headers. The token should be included in the `Authorization` header, e.g. `Authorization: Bearer <JWT token here>`.

### Endpoints

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/api/v1/user/authenticate` | POST | Used for requesting access tokens. Accepts credentials `username` and `password` as JSON or parameters. If credentials are valid, returns a 200 OK response containing access token as a JSON object, otherwise returns 403 Unauthorized.
| `/api/v1/user/account` | GET | **Authentication required.** Returns basic information about the authenticated user, such as name, email, etc.
| `/api/v1/user/account/credit` | POST | **Authentication required.** Increase the authenticated user's account balance. Accepts parameter `amount` that should be an integer. Returns new account balance.
| `/api/v1/user/account/debit` | POST | **Authentication required.** Decrease the authenticated user's account balance. Accepts parameter `amount` that should be an integer. Returns new account balance.
| `/api/v1/user/register` | POST | Register a new account. Accepts credentials `username`, `password`, `realname` and `email`. Returns the new account as JSON.
| `/api/v1/product/purchase` | POST | Buy an item. Accept `barcode`, `price` and `product_name`. Returns the purchase as JSON.
