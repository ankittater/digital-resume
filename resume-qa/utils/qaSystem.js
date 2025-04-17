import { initializeVectorStore, similaritySearch } from './vectorStore.js';
import * as textSimilarity from './textSimilarity.js';
import * as deepseek from './deepseek.js';

// Track if the system is initialized
let initialized = false;
let usingFallback = false;

/**
 * Initialize the QA system by loading and processing the resume
 * @param {string} filePath - Path to the resume file
 * @returns {boolean} - Success status
 */
export async function initializeQASystem(filePath) {
  try {
    // Try to initialize the vector store first
    try {
      console.log('Trying to initialize vector store with Hugging Face embeddings...');
      const success = await initializeVectorStore(filePath);
      
      if (success) {
        initialized = true;
        usingFallback = false;
        console.log('QA System initialized successfully with Hugging Face embeddings');
        return true;
      }
    } catch (error) {
      console.error('Error initializing vector store with Hugging Face:', error);
      console.log('Falling back to text similarity system...');
    }
    
    // If Hugging Face fails, fall back to the text similarity system
    const fallbackSuccess = await textSimilarity.initialize(filePath);
    
    if (fallbackSuccess) {
      initialized = true;
      usingFallback = true;
      console.log('QA System initialized successfully with fallback text similarity');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error initializing QA system:', error);
    return false;
  }
}

/**
 * Answer a question about the resume
 * @param {string} question 
 * @returns {string} Answer
 */
export async function askQuestion(question) {
  if (!initialized) {
    return "The QA system has not been initialized yet.";
  }
  
  try {
    // Search for relevant documents using either vector similarity or text similarity
    let relevantDocs;
    
    if (usingFallback) {
      relevantDocs = await textSimilarity.search(question, 3);
    } else {
      try {
        relevantDocs = await similaritySearch(question, 3);
      } catch (error) {
        console.error('Error with vector search, falling back to text similarity:', error);
        relevantDocs = await textSimilarity.search(question, 3);
      }
    }
    
    if (!relevantDocs || relevantDocs.length === 0) {
      return "I don't have enough information to answer that question based on the resume.";
    }
    
    // Process the results
    // First check if it's a question about a specific section
    const sectionMatch = question.match(/(?:what|tell me about|information on|details about|list|share) .* (skills|experience|education|certifications|profile|about|contact|competencies|work|job|technical)/i);
    
    // If it's a section question, and we found a relevant section
    if (sectionMatch) {
      const sectionKeyword = sectionMatch[1].toLowerCase();
      
      // Find a relevant section
      const sectionDoc = relevantDocs.find(doc => 
        doc.section.toLowerCase().includes(sectionKeyword) ||
        doc.text.toLowerCase().includes(sectionKeyword)
      );
      
      if (sectionDoc) {
        // If DeepSeek is configured, use it to generate a better answer
        if (deepseek.isDeepSeekConfigured()) {
          return await deepseek.generateAnswer(sectionDoc.fullSection, question);
        }
        return sectionDoc.fullSection;
      }
    }
    
    // Combine the relevant documents for context
    const context = relevantDocs
      .map(doc => doc.text)
      .join('\n\n');
    
    // If DeepSeek is configured, use it to generate a better answer
    if (deepseek.isDeepSeekConfigured()) {
      return await deepseek.generateAnswer(context, question);
    }
    
    // Fallback to the most relevant document
    return relevantDocs[0].text;
  } catch (error) {
    console.error('Error processing question:', error);
    return "Sorry, I encountered an error while processing your question.";
  }
} 