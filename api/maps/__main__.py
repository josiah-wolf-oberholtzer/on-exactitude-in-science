import asyncio
import logging

from .goblin import GoblinManager, load_schema
from .loader import load


async def main():
    async with GoblinManager() as goblin_app:
        await load_schema(goblin_app)
    await load("/data", consumer_count=10, limit=1_000_000)
    # TODO:
    # Load schema
    # Load vertices
    # Build entity ID indices
    # Build mixed indices
    # Load edges (using entity ID lookups)
    # TODO: Memory optimization: is goblin session holding onto entity references?


if __name__ == "__main__":
    logging.basicConfig()
    logging.getLogger("maps").setLevel(logging.INFO)
    asyncio.run(main())
