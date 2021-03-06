import asyncio
import logging
from contextlib import ExitStack
from pathlib import Path

import click
from uqbar.io import Profiler

from maps import goblin, loader


@click.group()
@click.pass_context
def cli(ctx):
    ctx.ensure_object(dict)
    logging.basicConfig(
        format="%(asctime)s %(name)s %(levelname)-8s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
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
@click.option("--profile/--no-profile", default=False)
@click.pass_context
def data_load(ctx, path: str, limit, workers, profile):
    async def run():
        aliases = {"graph": "g", "testgraph": "tg"}
        manager = goblin.GoblinManager(aliases={"g": aliases[ctx.obj["graph"]]})
        with ExitStack() as stack:
            if profile:
                stack.enter_context(Profiler())
            async with manager as goblin_app:
                await loader.load(
                    goblin_app, Path(path), consumer_count=workers, limit=limit
                )

    asyncio.run(run())
