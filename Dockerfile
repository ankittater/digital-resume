FROM node:22.14.0-slim

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .


# Debug: List files to verify contents
RUN ls -la

# Expose port
EXPOSE 9000

# Start the application with explicit path to ensure it's found
CMD ["node", "./app.js"] 