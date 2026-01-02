# Use an official lightweight Python image
FROM python:3.11-slim

# Set work directory
WORKDIR /code

# Install system dependencies (needed for some python packages)
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt

# Copy the application code
COPY . .

# Expose the port
EXPOSE 8000