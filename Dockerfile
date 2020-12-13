FROM node:12
ENV SSH_USER="frostybot"
ENV SSH_PASS="__frostybot123__"
ENV SSH_PORT=22
ENV FROSTYBOT_PORT=80
WORKDIR /usr/local/frostybot-js
COPY package*.json ./
RUN npm install && apt-get update -y && apt-get install -y sudo jq wget sqlite3 git openssh-server
COPY . .
RUN ln -s /usr/local/frostybot-js/frostybot /usr/bin/frostybot
RUN mkdir -p /var/run/sshd
RUN chmod +x ./entrypoint.sh
EXPOSE $SSH_PORT $FROSTYBOT_PORT
ENTRYPOINT [ "./entrypoint.sh" ]