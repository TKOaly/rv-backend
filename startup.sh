#!/bin/bash
if [ $NODE_ENV != "production" ]
then
    ./node_modules/knex/bin/cli.js migrate:rollback --env $NODE_ENV
    ./node_modules/knex/bin/cli.js migrate:latest --env $NODE_ENV
    ./node_modules/knex/bin/cli.js seed:run --env $NODE_ENV
else
    ./node_modules/knex/bin/cli.js migrate:latest --env $NODE_ENV
fi

npm start
