# rv-user-service
RV user service

## Configuration

Environment variables:

| Variable  | Description |
| ------------- | ------------- |
| DATABASE_URL  | Address for database |
| JWT_SECRET  | Secret key for signing JWT tokens |
| PORT | Port used by server |
| NODE_ENV | Environment for Node, can be one of `development`, `test` or `production`. Defaults to `development` |

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
