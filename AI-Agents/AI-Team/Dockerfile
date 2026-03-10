# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Install wait-for-it or similar utilities if needed, and docker cli for subprocess docker calls
RUN apt-get update && apt-get install -y docker.io && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt ./

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Expose any necessary ports (MCP communicates over STDIO by default so port exposure is optional)
# EXPOSE 6333  # If Qdrant was running inside the same container

# Run the MCP Server over STDIO
ENTRYPOINT ["python", "mcp_server.py"]
