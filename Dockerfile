FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm ci

COPY ./src ./src
COPY ./test ./test
COPY ./knexfile.js .
COPY ./openapi.yaml .
COPY ./startup.sh ./startup.sh

RUN chmod +x ./startup.sh

CMD ["./startup.sh"]
