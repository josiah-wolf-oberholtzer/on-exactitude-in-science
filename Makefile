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

test-api:
	docker-compose run --rm api make test
