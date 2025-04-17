import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { initializeQASystem, askQuestion } from './utils/qaSystem.js';

// Configure environment variables
dotenv.config();

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Initialize the QA system with vector embeddings
console.log('Initializing QA System...');
const resumePath = path.join(__dirname, 'resources', 'cv.md');

// Start server first, then initialize the QA system
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to ask questions about the resume`);
  
  // Initialize QA system after server starts
  initializeQASystem(resumePath)
    .then(success => {
      if (!success) {
        console.warn('Warning: QA System initialization had issues. Some features may not work correctly.');
      } else {
        console.log('QA System initialization completed successfully.');
      }
    })
    .catch(error => {
      console.error('Fatal error initializing QA System:', error);
    });
});

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    
    console.log(`Received question: "${question}"`);
    const answer = await askQuestion(question);
    console.log(`Generated answer (${answer.length} chars)`);
    
    res.json({ answer });
  } catch (error) {
    console.error('Error processing question:', error);
    res.status(500).json({ 
      error: 'An error occurred while processing your question',
      details: error.message 
    });
  }
}); 