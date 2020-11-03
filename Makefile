DATASET_YEAR ?= 2020
DATASET_MONTH ?= 10
DATASET_DAY ?= 01
DATASET_TIMESTAMP := ${DATASET_YEAR}${DATASET_MONTH}${DATASET_DAY}
LIMIT ?= 10000
WORKERS ?= 8

fetch-dataset:
	mkdir -p data/
	curl --fail http://discogs-data.s3-us-west-2.amazonaws.com/data/${DATASET_YEAR}/discogs_${DATASET_TIMESTAMP}_artists.xml.gz > data/discogs_${DATASET_TIMESTAMP}_artists.xml.gz
	curl --fail http://discogs-data.s3-us-west-2.amazonaws.com/data/${DATASET_YEAR}/discogs_${DATASET_TIMESTAMP}_labels.xml.gz > data/discogs_${DATASET_TIMESTAMP}_labels.xml.gz
	curl --fail http://discogs-data.s3-us-west-2.amazonaws.com/data/${DATASET_YEAR}/discogs_${DATASET_TIMESTAMP}_masters.xml.gz > data/discogs_${DATASET_TIMESTAMP}_masters.xml.gz
	curl --fail http://discogs-data.s3-us-west-2.amazonaws.com/data/${DATASET_YEAR}/discogs_${DATASET_TIMESTAMP}_releases.xml.gz > data/discogs_${DATASET_TIMESTAMP}_releases.xml.gz

reset-janusgraph:
	docker-compose stop
	docker-compose rm -f
	docker-compose up --remove-orphans -d scylla elasticsearch janusgraph

wait-for-janusgraph:
	docker-compose run --rm janusgraph-healthcheck

load-data: wait-for-janusgraph
	time docker-compose run --rm api python3 -m maps data load --limit ${LIMIT} --workers ${WORKERS}

load-data-unlimited: wait-for-janusgraph
	time docker-compose run --rm api python3 -m maps data load --workers ${WORKERS}

load-data-profiled: wait-for-janusgraph
	time docker-compose run --rm api python3 -m maps data load --limit ${LIMIT} --workers ${WORKERS} --profile

load-schema: wait-for-janusgraph
	docker-compose run --rm api python3 -m maps schema load

load-schema-test: wait-for-janusgraph
	docker-compose run --rm api python3 -m maps schema --graph testgraph load

load-from-scratch: reset-janusgraph wait-for-janusgraph load-schema load-schema-test load-data

build-gui:
	cd gui && yarn install && yarn build

gremlin-docker:
	docker exec -it $$(docker-compose ps --quiet janusgraph) ./bin/gremlin.sh

gremlin-kubectl:
	kubectl exec -tic janusgraph $$(kubectl get pods --selector=app=janusgraph -o jsonpath="{.items[0].metadata.name}") -- ./bin/gremlin.sh

graphana:
	kubectl port-forward `kubectl get -n prometheus-operator pods -l app.kubernetes.io/name=grafana -o jsonpath='{.items[0].metadata.name}'` -n prometheus-operator 8080:3000
