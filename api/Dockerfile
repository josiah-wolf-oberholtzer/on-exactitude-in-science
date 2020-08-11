FROM alpine:3.11
WORKDIR /app
RUN apk update \
    && apk add --no-cache --virtual .build-dependencies build-base libffi-dev musl-dev python3-dev \
    && apk add --no-cache --virtual .runtime-dependencies curl git jq make python3
COPY requirements*.txt /app/
RUN python3 -m ensurepip \
    && pip3 install -U pip \
    && pip3 install -r requirements.txt -r requirements-test.txt \
    && apk del .build-dependencies
COPY . /app/
RUN pip3 install -e .
