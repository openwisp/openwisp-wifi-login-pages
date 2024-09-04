FROM node:20.10-alpine

LABEL Enock simiyu "enocksimiyu8@gmail.com"

RUN apk add --no-cache supervisor rsync tar

RUN rm -rf /var/cache/apk/* /tmp/*

RUN mkdir -p /opt/openwisp/wifi-login-pages

ENV HOME=/opt/openwisp/wifi-login-pages

WORKDIR $HOME

COPY ./package.json .

COPY ./yarn.lock .

RUN yarn install

RUN npm install pm2 -g

COPY ./init_command.sh \
    ./wifi_login_pages.sh \
    ./docker-entrypoint.sh \
    ./supervisord.conf \
    ./utils.sh ./

RUN chmod +x ./utils.sh && \
    chmod +x ./init_command.sh && \
    chmod +x ./utils.sh && \
    chmod +x ./wifi_login_pages.sh && \
    chmod +x ./docker-entrypoint.sh

COPY ./ .

ENV MODULE_NAME=wifi_login_pages \
    PYTHONUNBUFFERED=1 \
    DOLLAR=$ \
    API_INTERNAL=api.internal \
    REACT_APP_ALLOWED_HOSTS='cleaninglimited.info login.cleaninglimited.info localhost netmanager.local wifi.login.internal' \
    REACT_APP_SERVER_URL=http://localhost:8000 \
    DASHBOARD_INTERNAL=dashboard.internal

VOLUME /opt/openwisp/wifi-login-pages/organizations/

VOLUME /opt/openwisp/wifi-login-pages/dist/

RUN yarn build

#ENTRYPOINT ["sh","docker-entrypoint.sh"]


#
#EXPOSE $SERVER $CLIENT

COPY wif_login_pages.template .

#RUN envsubst '$VIRTUAL_HOST $SERVER $CLIENT' < ./wif_login_pages.template > /etc/nginx/nginx.conf

EXPOSE $SERVER

CMD ["sh", "init_command.sh"]
