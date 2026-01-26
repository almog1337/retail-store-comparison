FROM postgres:latest

# Copy schema so it runs on first container start via docker-entrypoint-initdb.d
COPY schema.sql /docker-entrypoint-initdb.d/01-schema.sql
