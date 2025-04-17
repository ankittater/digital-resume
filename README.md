# Resume Q&A System

This is a web application that uses your resume as a knowledge base to answer questions about your profile using LangChain and DeepSeek's language models.

## Prerequisites

- Node.js (v14 or higher)
- DeepSeek API key (sign up at https://deepseek.com/)

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `resume.md` file in the resources directory and paste your resume content in Markdown format
4. Create a `.env` file and add your API key:
   ```
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   PORT=3000
   ```

## Usage

1. Start the server using one of these commands:
   ```bash
   # For production
   npm start

   # For development (with auto-reload)
   npm run dev
   ```
2. Open your browser and navigate to `http://localhost:3000`
3. Ask questions about your resume in the text area
4. Click "Ask" to get answers based on your resume content

## Resume Format

Create your resume in Markdown format using standard Markdown syntax. For example:

```markdown
# Your Name

## Summary
A brief summary of your professional background...

## Experience
### Company Name (YYYY-YYYY)
- Responsibility 1
- Responsibility 2

## Education
### University Name
- Degree in Field (Year)

## Skills
- Skill 1
- Skill 2
```

## How it Works

The application:
1. Loads your Markdown resume
2. When a question is asked, it passes both the resume content and the question to DeepSeek's chat model
3. The model generates a relevant answer based on the information in your resume

## Development

- Use `npm run dev` for development - it will automatically reload the server when you make changes
- The application uses nodemon for development server auto-reloading
- Your resume file should be placed in the `resources` directory as `cv.md`

## Important Notes

- Your resume should be in Markdown format (`.md`)
- The system is optimized to understand Markdown structure (headers, lists, etc.)
- Keep your DeepSeek API key secure and never commit it to version control
- The application uses DeepSeek's chat model to generate relevant answers based on your resume content
- You can adjust the model parameters like temperature and max tokens in the qaSystem.js file 