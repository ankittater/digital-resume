#!/bin/bash

# Copy example env file if .env doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env file from example"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

echo "Setup complete! Start the application with 'npm run dev'" 