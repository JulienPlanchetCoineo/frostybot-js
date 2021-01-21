FROM node:12
ENV SSH_USER="frostybot"
ENV SSH_PASS="__frostybot123__"
ENV SSH_PORT=22
ENV FROSTYBOT_PORT=80
RUN apt-get update -y && apt-get install -y sudo jq wget sqlite3 git openssh-server
RUN mkdir -p /usr/local && cd /usr/local && git clone https://github.com/CryptoMF/frostybot-js.git frostybot-js
WORKDIR /usr/local/frostybot-js
COPY package*.json ./
RUN npm install
RUN ln -s /usr/local/frostybot-js/frostybot /usr/bin/frostybot
COPY .gitignore ./
COPY entrypoint.sh ./
RUN chmod +x ./entrypoint.sh
EXPOSE $SSH_PORT $FROSTYBOT_PORT
ENTRYPOINT [ "./entrypoint.sh" ]