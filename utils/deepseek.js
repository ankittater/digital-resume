import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// DeepSeek API endpoint
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * Generate an answer using DeepSeek API
 * @param {string} context - The context from the resume
 * @param {string} question - The user's question
 * @returns {string} - The generated answer
 */
export async function generateAnswer(context, question) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is missing in environment variables');
    }
    
    // Create the prompt for DeepSeek
    const prompt = `
You are a helpful AI assistant that answers questions about a person's resume.
Use only the information in the following context to answer the question.
If the information is not in the context, say you don't know.

Context from resume:
${context}

Question: ${question}

Answer:
`;
    
    // Make the API request
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant that answers questions about resumes.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    // Extract the answer from the response
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content.trim();
    } else {
      throw new Error('Invalid response from DeepSeek API');
    }
  } catch (error) {
    console.error('Error generating answer with DeepSeek:', error.message);
    
    // Fallback to a simple response if DeepSeek fails
    return `Based on the resume, here's what I found: ${context}`;
  }
}

/**
 * Check if DeepSeek API is configured
 * @returns {boolean} - True if API key is configured
 */
export function isDeepSeekConfigured() {
  return !!process.env.DEEPSEEK_API_KEY;
} 