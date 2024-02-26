# Using REST client with VSCode

## Admin routes

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

## Normal routes

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
