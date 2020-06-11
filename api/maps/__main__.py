import asyncio
import logging

from .goblin import GoblinManager, install_schema
from .loader import load


async def main():
    async with GoblinManager() as goblin_app:
        await install_schema(goblin_app)
    await load("/data", consumer_count=10, limit=500_000)


if __name__ == "__main__":
    logging.basicConfig()
    logging.getLogger("maps").setLevel(logging.INFO)
    asyncio.run(main())
