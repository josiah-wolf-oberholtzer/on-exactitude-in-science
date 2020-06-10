import asyncio
import logging

from .goblin import GoblinManager, install_indices, install_schema
from .loader import load


async def main():
    async with GoblinManager() as goblin_app:
        await install_schema(goblin_app)
    await load("/data", consumer_count=10, limit=100_000)
    async with GoblinManager() as goblin_app:
        await install_indices(goblin_app)


if __name__ == "__main__":
    logging.basicConfig()
    logging.getLogger("maps").setLevel(logging.INFO)
    asyncio.run(main())
