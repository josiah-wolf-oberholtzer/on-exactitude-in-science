from pathlib import Path

import pytest

from maps import loader


@pytest.mark.asyncio
async def test_loader_run():
    await loader.run(Path(__file__).parent, consumer_count=4)
    raise Exception
