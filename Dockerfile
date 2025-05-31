FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm ci

COPY ./src ./src
COPY ./test ./test
COPY ./knexfile.js .
COPY ./openapi.yaml .
COPY ./startup.sh ./startup.sh
COPY ./tsconfig.json .

RUN chmod +x ./startup.sh

RUN npm run build

CMD ["./startup.sh"]
