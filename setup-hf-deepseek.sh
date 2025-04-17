#!/bin/bash

echo "Setting up Resume Q&A with Hugging Face and DeepSeek..."

# Remove node_modules if it exists
if [ -d "node_modules" ]; then
  echo "Removing existing node_modules..."
  rm -rf node_modules
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cp .env.example .env
  echo ".env file created. Please edit it to add your API keys."
  
  # Prompt for API keys
  read -p "Enter your Hugging Face API key: " hf_key
  read -p "Enter your DeepSeek API key: " ds_key
  
  # Update .env file with provided keys
  if [ ! -z "$hf_key" ]; then
    sed -i '' "s/your_huggingface_api_key_here/$hf_key/g" .env
  fi
  
  if [ ! -z "$ds_key" ]; then
    sed -i '' "s/your_deepseek_api_key_here/$ds_key/g" .env
  fi
else
  echo ".env file already exists. Please make sure it contains your API keys."
fi

echo "Setup complete! Start the application with 'npm run dev'" 