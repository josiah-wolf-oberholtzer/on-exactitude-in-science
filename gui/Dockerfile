FROM alpine:3.11 as builder
RUN apk update && apk add libx11 libxext nodejs yarn
COPY package.json .
RUN yarn install --no-optional
COPY . .
RUN yarn build

FROM nginx:mainline-alpine
COPY default.conf /etc/nginx/conf.d/
COPY --from=builder dist/* /var/www/html/
