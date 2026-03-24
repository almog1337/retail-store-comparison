FROM postgres:latest

# Create the Superset metadata DB before applying the retail schema
COPY init-scripts/00-create-superset-db.sh /docker-entrypoint-initdb.d/00-create-superset-db.sh
RUN chmod +x /docker-entrypoint-initdb.d/00-create-superset-db.sh

# Copy schema so it runs on first container start via docker-entrypoint-initdb.d
COPY schema.sql /docker-entrypoint-initdb.d/01-schema.sql
