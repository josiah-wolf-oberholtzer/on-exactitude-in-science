DATASET_YEAR ?= 2020
DATASET_MONTH ?= 05
DATASET_DAY ?= 01
DATASET_TIMESTAMP := ${DATASET_YEAR}${DATASET_MONTH}${DATASET_DAY}

fetch-dataset:
	mkdir -p data/
	curl http://discogs-data.s3-us-west-2.amazonaws.com/data/${DATASET_YEAR}/discogs_${DATASET_TIMESTAMP}_artists.xml.gz > data/discogs_${DATASET_TIMESTAMP}_artists.xml.gz
	curl http://discogs-data.s3-us-west-2.amazonaws.com/data/${DATASET_YEAR}/discogs_${DATASET_TIMESTAMP}_labels.xml.gz > data/discogs_${DATASET_TIMESTAMP}_labels.xml.gz
	curl http://discogs-data.s3-us-west-2.amazonaws.com/data/${DATASET_YEAR}/discogs_${DATASET_TIMESTAMP}_masters.xml.gz > data/discogs_${DATASET_TIMESTAMP}_masters.xml.gz
	curl http://discogs-data.s3-us-west-2.amazonaws.com/data/${DATASET_YEAR}/discogs_${DATASET_TIMESTAMP}_releases.xml.gz > data/discogs_${DATASET_TIMESTAMP}_releases.xml.gz

reset-janusgraph:
	docker-compose stop
	docker-compose rm -f
	docker-compose up -d cassandra elasticsearch janusgraph

wait-for-janusgraph:
	docker-compose run --rm janusgraph-healthcheck

load-data: wait-for-janusgraph
	docker-compose run --rm api python3 -m maps data load --limit 10000 --workers 8

load-schema: wait-for-janusgraph
	docker-compose run --rm api python3 -m maps schema load

load-schema-test: wait-for-janusgraph
	docker-compose run --rm api python3 -m maps schema --graph testgraph load

load-from-scratch: reset-janusgraph wait-for-janusgraph load-schema load-schema-test load-data
