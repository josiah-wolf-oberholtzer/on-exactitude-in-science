from celery import Celery

app = Celery(
    "maps.tasks",
    broker="redis://redis",
    task_serializer="msgpack",
)


@app.task
def load_artist_edges():
    pass


@app.task
def load_artist_vertex():
    pass


@app.task
def load_company_edges():
    pass


@app.task
def load_company_vertex():
    pass


@app.task
def load_master_vertex():
    pass


@app.task
def load_release_vertex_and_edges():
    pass
