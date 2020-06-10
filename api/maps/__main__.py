import asyncio
import logging

from .goblin import GoblinManager, load_schema
from .loader import load


async def main():
    async with GoblinManager() as goblin_app:
        await load_schema(goblin_app)
    await load("/data", consumer_count=10, limit=10000)


if __name__ == "__main__":
    logging.basicConfig()
    logging.getLogger("maps").setLevel(logging.INFO)
    asyncio.run(main())
