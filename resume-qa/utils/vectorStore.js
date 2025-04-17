import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { HfInference } from '@huggingface/inference';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// In-memory vector database
let documents = [];
let embeddings = [];
let initialized = false;

/**
 * Initialize the vector store with the resume content
 * @param {string} filePath - Path to the resume file
 */
export async function initializeVectorStore(filePath) {
  try {
    console.log('Initializing vector store with Hugging Face embeddings...');
    
    // Read and parse the resume file
    const resumeContent = fs.readFileSync(filePath, 'utf8');
    
    // Split content into sections and chunks
    const sections = resumeContent.split(/^#+ /m)
      .filter(section => section.trim().length > 0)
      .map(section => section.trim());
    
    // Process chunks for vectorization
    const chunks = [];
    const metadata = [];
    
    for (const section of sections) {
      // Get section title (first line)
      const lines = section.split('\n');
      const title = lines[0].trim();
      
      // Split section into smaller chunks (paragraphs)
      const sectionChunks = section
        .split(/\n\n+/)
        .filter(chunk => chunk.trim().length > 0);
      
      // Store each chunk with its metadata
      sectionChunks.forEach(chunk => {
        chunks.push(chunk);
        metadata.push({
          text: chunk,
          section: title,
          fullSection: section
        });
      });
    }
    
    console.log(`Created ${chunks.length} text chunks from resume`);
    
    // Generate embeddings for all chunks
    console.log('Generating embeddings using Hugging Face API...');
    
    // Use sentence-transformers model for embeddings
    const embeddingModel = "sentence-transformers/all-MiniLM-L6-v2";
    
    // Process chunks in batches to avoid rate limits
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      batches.push(chunks.slice(i, i + batchSize));
    }
    
    // Process each batch
    const embeddingResults = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i+1}/${batches.length}...`);
      
      // Generate embeddings for this batch
      const batchEmbeddings = await Promise.all(
        batch.map(async (text) => {
          try {
            const embedding = await hf.featureExtraction({
              model: embeddingModel,
              inputs: text
            });
            return embedding;
          } catch (error) {
            console.error(`Error generating embedding for chunk: ${error.message}`);
            // Return a zero vector as fallback
            return new Array(384).fill(0);
          }
        })
      );
      
      embeddingResults.push(...batchEmbeddings);
    }
    
    // Store documents and embeddings
    documents = metadata;
    embeddings = embeddingResults;
    
    initialized = true;
    console.log('Vector store initialized successfully with Hugging Face embeddings');
    return true;
  } catch (error) {
    console.error('Error initializing vector store:', error);
    return false;
  }
}

/**
 * Find the most similar documents to a query
 * @param {string} query - The search query
 * @param {number} topK - Number of results to return
 * @returns {Array} - Array of relevant documents with their similarity scores
 */
export async function similaritySearch(query, topK = 3) {
  if (!initialized) {
    throw new Error('Vector store not initialized');
  }
  
  try {
    // Generate embedding for the query
    const queryEmbedding = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: query
    });
    
    // Calculate cosine similarity between query and all documents
    const similarities = embeddings.map((docEmbedding) => {
      return cosineSimilarity(queryEmbedding, docEmbedding);
    });
    
    // Find top K results
    const topResults = similarities
      .map((score, index) => ({ score, index }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      // Filter out low similarity results
      .filter(result => result.score > 0.3);
    
    // Return documents with their similarity scores
    return topResults.map(result => ({
      ...documents[result.index],
      similarity: result.score
    }));
  } catch (error) {
    console.error('Error in similarity search:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Array} vecA - First vector
 * @param {Array} vecB - Second vector
 * @returns {number} - Cosine similarity (0-1)
 */
function cosineSimilarity(vecA, vecB) {
  // Calculate dot product
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  
  // Calculate magnitudes
  let magA = 0;
  let magB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  
  // Calculate cosine similarity
  if (magA === 0 || magB === 0) {
    return 0;
  }
  
  return dotProduct / (magA * magB);
} 