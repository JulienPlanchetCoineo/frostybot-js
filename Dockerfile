FROM node:12
WORKDIR /usr/local/frostybot
COPY package*.json ./
RUN npm install
RUN apt-get update -y && apt-get install -y jq wget sqlite3
RUN ln -s /usr/local/frostybot/frostybot /usr/bin/frostybot
COPY . .
EXPOSE 80
CMD [ "node", "./bin/www" ]