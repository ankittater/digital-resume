#!/bin/bash

# Copy example env file if .env doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env file from example"
  echo "Please edit the .env file to add your OpenAI API key"
  echo ""
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Prompt to set OpenAI API key if not set
if grep -q "your_openai_api_key_here" .env; then
  echo "Please enter your OpenAI API key:"
  read -r api_key
  sed -i '' "s/your_openai_api_key_here/$api_key/g" .env
  echo "OpenAI API key updated in .env file"
fi

echo "Setup complete! Start the application with 'npm run dev'" 