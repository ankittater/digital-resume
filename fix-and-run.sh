#!/bin/bash

echo "Fixing TensorFlow.js dependencies..."

# Remove node_modules if it exists
if [ -d "node_modules" ]; then
  echo "Removing existing node_modules..."
  rm -rf node_modules
fi

# Install specific working versions of dependencies
echo "Installing compatible TensorFlow.js versions..."
npm install --save @tensorflow/tfjs@3.21.0 @tensorflow/tfjs-node@3.21.0 @tensorflow-models/universal-sentence-encoder@1.3.3

# Install other dependencies
echo "Installing other dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  echo "PORT=3000" > .env
  echo ".env file created"
fi

# Start the application
echo "Starting the application..."
npm run dev 