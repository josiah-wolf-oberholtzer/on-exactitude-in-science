# on-exactitude-in-science
Map of the World

## Quickstart

Pull and build Docker images:

```
docker-compose pull
docker-compose build
```

Bring Cassandra, Elasticsearch and Janusgraph online:

```
docker-compose up -d cassandra elasticsearch janusgraph
```

Wait for Janusgraph to come online:

```
docker-compose run --rm janusgraph-healthcheck
```

Load the Discogs dataset into Janusgraph:

```
docker-compose run --rm api python3 -m maps
```
