#!/bin/bash

useradd -s /bin/bash -d /usr/local/frostybot-js $SSH_USER
adduser $SSH_USER sudo
echo $SSH_USER:$SSH_PASS | chpasswd
echo "$SSH_USER ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers
sed -i "/.*Port .*/cPort $SSH_PORT" /etc/ssh/sshd_config
sed -i "/URL=.*/cURL=\"http://127.0.0.1:$FROSTYBOT_PORT/frostybot\"" /usr/local/frostybot-js/frostybot
sed -i "/var port = .*/cvar port = $FROSTYBOT_PORT;" /usr/local/frostybot-js/bin/www

service ssh start
frostybot start

tail -f ./log/frostybot.log
