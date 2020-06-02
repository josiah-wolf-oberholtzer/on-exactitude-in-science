FROM alpine:3.11
WORKDIR /app
ENV SERVER_PORT=9090
RUN apk update \
    && apk add --virtual .runtime-dependencies git make python3 \
    && apk add --virtual .build-dependencies build-base python3-dev
COPY requirements*.txt /app/
RUN python3 -m ensurepip \
    && pip3 install -r requirements.txt -r requirements-test.txt \
    && apk del .build-dependencies
COPY . /app/
