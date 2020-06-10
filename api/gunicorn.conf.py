import os

for key, value in os.environ.items():
    if key.startswith("GUNICORN_"):
        key = key.split("_", 1)[1].lower()
        locals()[key] = value
