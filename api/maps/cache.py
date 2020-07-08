import asyncio
import hashlib
import json
import os

import aiomcache
import msgpack


class Cache:
    def __init__(
        self,
        host=os.environ.get("MEMCACHED_HOST", "memcached"),
        port=os.environ.get("MEMCACHED_PORT", 11211),
        loop=None,
    ):
        self.client = aiomcache.Client(host=host, port=port, loop=loop)

    @classmethod
    async def on_startup(cls, app):
        app["cache"] = cls(loop=asyncio.get_running_loop())

    @classmethod
    async def on_cleanup(cls, app):
        cache = app["cache"]
        cache.client.close()

    def get_cache_key(data, prefix=None):
        m = hashlib.sha1()
        m.update(json.dumps(data, sort_keys=True).encode())
        key = m.hexdigest()
        if prefix:
            return f"{prefix}-{key}"
        return key

    async def get(self, key):
        packed = await self.client.get(key)
        if packed is None:
            return None
        return msgpack.unpackb(packed)

    async def set(self, key, value, expiration=0):
        packed = msgpack.packb(value, use_bin_type=True)
        await self.client.set(key, packed, expiration)
