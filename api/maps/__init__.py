import asyncio

import uvloop
from aiogremlin.process.graph_traversal import __

from .goblin import get_session

asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
