#!/bin/bash

mkdir -p /var/run/sshd
useradd -s /bin/bash -d /usr/local/frostybot-js $SSH_USER
adduser $SSH_USER sudo
echo $SSH_USER:$SSH_PASS | chpasswd
echo "$SSH_USER ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers
sed -i "/.*Port .*/cPort $SSH_PORT" /etc/ssh/sshd_config
echo $FROSTYBOT_PORT > /usr/local/frostybot-js/.port

service ssh start
frostybot start

tail -f ./log/frostybot.log
