#!/bin/bash
./node_modules/knex/bin/cli.js migrate:latest --env $NODE_ENV
./node_modules/knex/bin/cli.js seed:run --env $NODE_ENV
./node_modules/knex/bin/cli.js migrate:latest --env test
./node_modules/knex/bin/cli.js seed:run --env test
npm start
