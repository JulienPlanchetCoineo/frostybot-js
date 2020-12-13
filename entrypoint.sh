#!/bin/bash

mkdir -p /var/run/sshd
useradd -s /bin/bash -d /usr/local/frostybot-js $SSH_USER
adduser $SSH_USER sudo
echo $SSH_USER:$SSH_PASS | chpasswd
echo "$SSH_USER ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers
sed -i "/.*Port .*/cPort $SSH_PORT" /etc/ssh/sshd_config
sqlite3 /usr/local/frostybot-js/database/database.db "INSERT OR REPLACE INTO settings (mainkey,subkey,value) VALUES ('core','port','$FROSTYBOT_PORT');"

service ssh start
frostybot start

tail -f ./log/frostybot.log
