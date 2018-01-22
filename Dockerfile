FROM node:carbon
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY ./src ./src
COPY ./test ./test
COPY ./knexfile.js .
COPY ./startup.sh ./startup.sh
RUN chmod +x ./startup.sh
CMD ["./startup.sh"]
