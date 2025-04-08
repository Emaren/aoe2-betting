# Dockerfile
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Ensure Python can import from /app
ENV PYTHONPATH="/app"

# Copy source code into container
COPY . /app

# Install PostgreSQL client, pip, and dependencies
RUN apt-get update && \
    apt-get install -y postgresql-client && \
    pip install --upgrade pip && \
    pip install -r requirements.txt && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Make wait-for-postgres script executable
RUN chmod +x /app/wait-for-postgres.sh

# Optional defaults (these can be overridden at runtime)
ENV POSTGRES_HOST=aoe2-postgres
ENV POSTGRES_PORT=5432
ENV POSTGRES_USER=aoe2user
ENV POSTGRES_DB=aoe2db

# Start script: wait for DB, migrate, launch app
CMD ["sh", "-c", "./wait-for-postgres.sh && flask db upgrade && python app.py"]
