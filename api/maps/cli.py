import asyncio
import logging

import click

from maps import goblin, loader


@click.group()
@click.pass_context
def cli(ctx):
    ctx.ensure_object(dict)
    logging.basicConfig()
    logging.getLogger("maps").setLevel(logging.INFO)


@cli.group()
@click.option("-g", "--graph", default="graph")
@click.pass_context
def schema(ctx, graph):
    ctx.obj["graph"] = graph


@cli.group()
@click.option("-g", "--graph", default="graph")
@click.pass_context
def data(ctx, graph):
    ctx.obj["graph"] = graph


@schema.command("load")
@click.pass_context
def schema_load(ctx):
    async def run():
        graph_name = ctx.obj["graph"]
        manager = goblin.GoblinManager()
        async with manager as goblin_app:
            await goblin.install_schema(goblin_app, graph_name=graph_name)

    asyncio.run(run())


@data.command("load")
@click.option(
    "-p",
    "--path",
    default="/data",
    type=click.Path(exists=True, file_okay=False, dir_okay=True),
)
@click.option("-l", "--limit", default=None, type=int)
@click.option("-w", "--workers", default=8)
@click.pass_context
def data_load(ctx, path, limit, workers):
    async def run():
        aliases = {"graph": "g", "testgraph": "tg"}
        manager = goblin.GoblinManager(aliases={"g": aliases[ctx.obj["graph"]]})
        async with manager as goblin_app:
            await loader.load(goblin_app, path, consumer_count=workers, limit=limit)

    asyncio.run(run())
