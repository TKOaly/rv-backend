FROM node:carbon-slim

ARG NODE_ENV=production

ENV NODE_ENV "$NODE_ENV"

WORKDIR /app

COPY package.json /app

COPY yarn.lock /app

RUN yarn install

COPY ./src /app/src

COPY ./knexfile.js /app

CMD ["yarn", "start"]