FROM node:iron-slim

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm install

COPY ./src ./src
COPY ./test ./test
COPY .mocharc.cjs .
COPY ./knexfile.js .
COPY ./startup.sh ./startup.sh

RUN chmod +x ./startup.sh

EXPOSE 9229

CMD ["./startup.sh"]
