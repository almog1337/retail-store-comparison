FROM apache/superset:latest

USER root
RUN uv pip install --no-cache psycopg2-binary --python /app/.venv/bin/python
USER superset
