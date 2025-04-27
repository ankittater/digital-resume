# JSON Resume RAG System

This is a web application that uses JSON data to create a personal portfolio website and power a question answering system about your professional profile using vector search and RAG (Retrieval Augmented Generation).

## Features

- **JSON-Driven Content**: All content is stored in a structured JSON file for easy updates
- **Responsive Portfolio Website**: Showcase your skills, experience, and projects
- **Interactive Q&A System**: Answer questions about your profile using AI
- **Local Vector Search**: Uses Transformers.js for local vector embeddings without external APIs
- **Fallback System**: Text similarity search when vector search isn't available

## Demo

Check out a live implementation of this system at [Ankit Tater's Portfolio](http://ankittater.com/). This demo showcases how the JSON Resume RAG System can be used to create a professional portfolio with an interactive Q&A feature.

## Prerequisites

- Node.js (v14 or higher)
- (Optional) DeepSeek API key for better answer generation (sign up at https://deepseek.com/)

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Edit the `resources/resume-data.json` file with your personal information
4. (Optional) Create a `.env` file and add your DeepSeek API key if you want enhanced answers:
   ```
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   PORT=9000
   ```

## Usage

1. Start the server using one of these commands:

   ```bash
   # For production
   npm start

   # For development (with auto-reload)
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:9000`
3. Browse your portfolio or ask questions in the Q&A section
4. Click "Ask" to get answers based on your resume content

## Docker

You can also run this application using Docker:

```bash
# Build the Docker image
docker build -t digital-resume .

# Run the container
docker run -p 9000:9000 -d digital-resume

# Run with environment variables (e.g., DeepSeek API key)
docker run -p 9000:9000 -e DEEPSEEK_API_KEY=your_key_here -d digital-resume

# Using Docker Compose
docker-compose up -d
```

Access your application at `http://localhost:9000` after running with Docker.

## Resume Data Structure

The `resume-data.json` file contains all your profile information in a structured format:

```json
{
  "meta": {
    "title": "Your Name - Professional Title",
    "description": "Brief description for SEO",
    "keywords": "comma, separated, keywords",
    "author": "Your Name",
    "image": "URL to your profile image",
    "url": "Your website URL"
  },
  "personal": {
    "name": "Your Name",
    "headline": "Your Professional Title",
    "location": "City, Country",
    "contacts": [
      {
        "type": "email",
        "value": "mailto:your.email@example.com",
        "icon": "fas fa-envelope"
      }
      // More contact methods...
    ]
  },
  // Additional sections...
  "resume_content": "Your full resume in Markdown format"
}
```

## How it Works

The application:

1. Loads your `resume-data.json` file
2. Uses the structured data to render the website
3. Uses the `resume_content` field for the RAG system
4. When a question is asked, it:
   - Creates vector embeddings of the resume content (using Transformers.js)
   - Finds the most relevant sections to the question
   - Generates a relevant answer based on those sections

## Development

- Use `npm run dev` for development with automatic server reload
- The application uses nodemon for development server auto-reloading
- All UI content is driven by the JSON data for easy customization

## Technical Details

- Uses Express.js for the web server
- EJS templates for rendering
- Transformers.js for local vector embeddings
- Bootstrap for responsive design
- Optional DeepSeek API integration for enhanced answer generation

## Credits

Built with Transformers.js, Express, and EJS.
