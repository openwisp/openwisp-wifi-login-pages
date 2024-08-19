FROM node:20.10-alpine

LABEL Enock simiyu "enocksimiyu8@gmail.com"

RUN apk add supervisor rsync tar

RUN rm -rf /var/cache/apk/* /tmp/*

RUN mkdir -p /opt/openwisp/wifi-login-pages

ENV HOME=/opt/openwisp/wifi-login-pages

WORKDIR $HOME

COPY ./package.json .

COPY ./yarn.lock .

RUN yarn install

COPY ./init_command.sh \
    ./wifi_login_pages.sh \
    ./supervisord.conf \
    ./utils.sh ./

RUN chmod +x ./utils.sh

RUN chmod +x ./init_command.sh

RUN chmod +x ./utils.sh

COPY ./ .

ENV MODULE_NAME=wifi_login_pages \
    PYTHONUNBUFFERED=1 \
    DOLLAR=$ \
    API_INTERNAL=api.internal

CMD ["sh", "init_command.sh"]

EXPOSE $SERVER $CLIENT
