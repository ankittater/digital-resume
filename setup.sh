#!/bin/bash

echo "Setting up JSON Resume RAG..."

# Copy example env file if .env doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env file from example"
  echo "Optional: Edit .env to add your DeepSeek API key for enhanced answers"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

echo "Setup complete! Edit resources/resume-data.json with your profile information"
echo "Start the application with 'npm run dev'" 