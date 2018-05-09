# rv-backend

[![Build Status](https://travis-ci.org/ohtu2018-rv/rv-backend.svg?branch=develop)](https://travis-ci.org/ohtu2018-rv/rv-backend) [![codecov](https://codecov.io/gh/ohtu2018-rv/rv-backend/branch/develop/graph/badge.svg)](https://codecov.io/gh/ohtu2018-rv/rv-backend)

RV backend

[Staging](https://rv-backend-dev.herokuapp.com)

[Production](https://rv-backend.herokuapp.com)

## Local development

To run the backend locally, you can either use [Docker](https://wwww.docker.com) or run it without Docker.

### With Docker

For Docker, the repo contains a `Dockerfile` for building a Docker image of the backend server and a [Docker Compose](https://docs.docker.com/compose) file for running both the backend server and a [PostgreSQL](https://www.postgresql.org) database inside Docker.

To set up a local environment, run the following commands:

1.  `docker-compose build` to build Docker images for the backend and database.
2.  `docker-compose up` to start the server and PostgreSQL database. Note the name of the server container, as you will need it for later steps.
3.  To create database schema, run `docker exec -it <server container name or id> npm run db-migrate`.
4.  To seed database with data for development, run `docker exec -it <server container name or id> npm run db-seed`.

By default, the server will listen on port 8081. See [.env](.env) for default configuration and [Configuration](#configuration) for an explanation of these variables.

To shut down the local environment, run `docker-compose down`. This will stop and remove any containers created by Docker Compose. Note that you will need to re-create the schema and reseed the database if you shut down your environment (steps 3 and 4) and start it up again.

On linux `sudo ./restart.sh` restarts a running docker.

### Without Docker

To run the backend without Docker, install [Node.js](https://nodejs.org) and [PostgreSQL](https://www.postgresql.org). Then, create a database and a user in PostgreSQL for the backend to use.

Then, to run the backend server:

1.  Run `npm install` to install packages needed by the backend server.
2.  Set environment variables:
    * `DATABASE_URL` is used by the backend to connect to a database server. For example, if your local database is running on port 5432 with user `user` and password `password` and database `db`, the value would be `postgres://user:password@localhost:5432/db`.
    * `JWT_SECRET` is used to sign authentication tokens issued by the server. This can be any string.
    * `PORT` is the port the backend server listens on.
    * Setting `NODE_ENV` is optional since it defaults to `development` but you can set it if you want try out environments other than development.
3.  If needed, clear database by running `npm run db-rollback`.
4.  Run `npm run db-migrate` to create or update the database schema to the latest version.
5.  Run `npm run db-seed` to seed the database with initial data.
6.  Finally, run `npm start-nodemon` to start the server. [Nodemon](https://github.com/remy/nodemon) will listen for changes in code and restart the server if necessary.

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

1.  Install REST client for VSCode
2.  Use `admin_auth.rest` to get your JWT
3.  Add the following to your VSCode config, replacing TOKEN:

```json
"rest-client.environmentVariables": {
        "$shared": {
            "rv_backend_admin_token": "TOKEN"
        }
    }
```

4.  You can now use REST client to make requests to the management 'back end.

### Normal routes

1.  Install REST client for VSCode
2.  Use `user_auth.rest` to get your JWT
3.  Add the following to your VSCode config, replacing TOKEN:

```json
"rest-client.environmentVariables": {
        "$shared": {
            "rv_backend_user_token": "TOKEN"
        }
    }
```

4.  You can now use REST client to make requests to the back end.

## API

### Authentication

The service uses [JWT tokens](https://jwt.io) for authenticating HTTP requests. All authenticated endpoints require that you include your JWT token in the request headers. The token should be included in the `Authorization` header, e.g. `Authorization: Bearer <JWT token here>`.

### Endpoints

| Endpoint                      | Method | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/api/v1/user/authenticate`   | POST   | Used for requesting access tokens. Accepts credentials `username` and `password` as JSON or parameters. If credentials are valid, returns a 200 OK response containing access token as a JSON object, otherwise returns 403 Unauthorized.                                                                                                                                                                                                                                                                                                                    |
| `/api/v1/user/account`        | GET    | **Authentication required.** Returns basic information about the authenticated user, such as name, email, etc.                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `/api/v1/user/account/credit` | POST   | **Authentication required.** Increase the authenticated user's account balance. Accepts parameter `amount` that should be an integer. Returns new account balance.                                                                                                                                                                                                                                                                                                                                                                                           |
| `/api/v1/user/account/debit`  | POST   | **Authentication required.** Decrease the authenticated user's account balance. Accepts parameter `amount` that should be an integer. Returns new account balance.                                                                                                                                                                                                                                                                                                                                                                                           |
| `/api/v1/user/register`       | POST   | Register a new account. Accepts credentials `username`, `password`, `realname` and `email`. Username and password should be at least 4 characters. On successful registration, returns a `201 Created` response that includes user information. If validation fails, or a user with `username` or `email` exists, returns a `403 Unauthorized` response with error message.                                                                                                                                                                                  |
| `/api/v1/product/purchase`    | POST   | **Authentication required**. Buy a product. Accepts parameters `barcode` and `quantity`. `barcode` is the barcode of the product being purchased and `quantity` is the amount being purchased. On successful purchase, returns product name, quantity purchased and account balance after purchase (`product_name`, `quantity` and `account_balance`, respectively). If the product is out of stock or doesn't exist, returns a `404 Not Found` response. If the user doesn't have enough funds on their account, will return a `403 Unauthorized` response. |
| `/api/v1/admin/products`      | POST   | **Authentication required**. Create a new product. Requires parametres `descr` (String), `pgrpid` (String), `weight` (Integer), `barcode` (String, 13 numbers), `count` (Integer), `buyprice` (Integer) and `sellprice` (Integer).                                                                                                                                                                                                                                                                                                                           |
| `/api/v1/admin/products/:barcode`      | GET   | **Authentication required**. Get a product by its barcode. Requires parameter `barcode` (String).                                                                                                                                                                                                                                                                                                                           |
| `/api/v1/admin/products/product/:productId`      | GET   | **Authentication required**. Get a product by its id. Requires parameter `productId` (String).                                                                                                                                                                                                                                                                                                                           |
| `/api/v1/user/products`       | GET    | Get all products. Returns an array of products.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `/api/v1/categories`          | GET    | Get all categories. Returns an array of categories.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `/api/v1/admin/boxes`         | GET    | **Authentication required**. Get all boxes. Returns an array of boxes.
| `/api/v1/admin/boxes/:barcode`| GET    | **Authentication required**. Get a box by its barcode. URL parameter `barcode` is required.
| `/api/v1/admin/boxes/:barcode`| POST   | **Authentication required**. Buy in boxes of products. URL parameter barcode is required. Requests should be JSON with these fields: `boxes`: how many boxes are being added, `buyprice`: the acquisition cost of a single iten, `sellprice`: selling price of a single item. Returns `200 OK` if the request is successful, `4xx` if the request is invalid or `500 Internal Server Error` if some other error occurred.
| `/api/v1/admin/boxes/:barcode`| PUT    | **Authentication required**. Create or update a box and the product it contains. Requires JSON with fields: `items_per_box`, `product`. `product` should be an object with fields `product_barcode`, `product_name`, `product_group`, `product_weight`, `product_buyprice`, `product_sellprice`.  Returns `201 Created` if a new box is created or `200 OK` if the box is updated.

