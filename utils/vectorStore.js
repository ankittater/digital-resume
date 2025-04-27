import path from "path";
import { fileURLToPath } from "url";
import { pipeline } from "@xenova/transformers";
import dotenv from "dotenv";
import fs from "fs";
import {
  EMBEDDING_MODEL,
  DEFAULT_TOP_K,
  MIN_SIMILARITY_SCORE,
  RESUME_DATA_PATH
} from "./config.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory vector database
let documents = [];
let embeddings = [];
let initialized = false;
let featureExtractor = null;

/**
 * Initialize feature extraction pipeline
 */
async function initializeFeatureExtractor() {
  if (!featureExtractor) {
    // Load feature extraction pipeline locally
    console.log("Loading feature extraction model locally...");
    featureExtractor = await pipeline("feature-extraction", EMBEDDING_MODEL);
    console.log("Feature extraction model loaded successfully");
  }
  return featureExtractor;
}

/**
 * Get embeddings from local model
 * @param {string} text - The text to embed
 * @returns {Promise<Array>} - The embedding vector
 */
async function getEmbedding(text) {
  const extractor = await initializeFeatureExtractor();
  const result = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(result.data);
}

/**
 * Initialize the vector store with the resume content
 * @param {string} resumeContent - Resume content as text (optional, if not provided, will load from config file)
 */
export async function initializeVectorStore(resumeContent = null) {
  try {
    console.log("Initializing vector store with local embeddings model...");
    
    // If no resume content is provided, load it from the config file
    if (!resumeContent) {
      try {
        console.log("Loading resume data from config file...");
        const resumeData = JSON.parse(fs.readFileSync(RESUME_DATA_PATH, "utf8"));
        
        // If there's no resume_content field in the JSON, create it from the structured data
        if (!resumeData.resume_content) {
          console.log("Creating resume_content from structured data...");
          // Create a structured text representation of the resume data
          const contentSections = [];
          
          // Add personal information
          contentSections.push(`# Personal\n${resumeData.content.personal.name}\n${resumeData.content.personal.headline}\n${resumeData.content.personal.location}`);
          
          // Add about section
          if (resumeData.content.about) {
            contentSections.push(`# About\n${resumeData.content.about.summary.join('\n\n')}`);
          }
          
          // Add experience section
          if (resumeData.content.experience) {
            const experienceText = resumeData.content.experience.items.map(job => 
              `${job.position} at ${job.company} (${job.period})\n${job.responsibilities.join('\n')}`
            ).join('\n\n');
            contentSections.push(`# Experience\n${experienceText}`);
          }
          
          // Add skills section
          if (resumeData.content.skills) {
            const skillsText = resumeData.content.skills.categories.map(category => 
              `${category.name}: ${category.skills.join(', ')}`
            ).join('\n\n');
            contentSections.push(`# Skills\n${skillsText}`);
          }
          
          // Add projects section
          if (resumeData.content.projects) {
            const projectsText = resumeData.content.projects.items.map(project => 
              `${project.title}\n${project.description}\nTechnologies: ${project.technologies.join(', ')}`
            ).join('\n\n');
            contentSections.push(`# Projects\n${projectsText}`);
          }
          
          // Add education section
          if (resumeData.content.education) {
            const educationText = resumeData.content.education.items.map(edu => 
              `${edu.degree} from ${edu.institution} (${edu.year})\n${edu.description}`
            ).join('\n\n');
            contentSections.push(`# Education\n${educationText}`);
          }
          
          // Add certifications section
          if (resumeData.content.certifications) {
            const certificationsText = resumeData.content.certifications.items.map(cert => 
              `${cert.name} (${cert.date})\n${cert.description}`
            ).join('\n\n');
            contentSections.push(`# Certifications\n${certificationsText}`);
          }
          
          // Add engineering excellence section
          if (resumeData.content.engineering_excellence) {
            const excellenceText = resumeData.content.engineering_excellence.sections.map(section => 
              `${section.title}\n${section.intro}`
            ).join('\n\n');
            contentSections.push(`# Engineering Excellence\n${excellenceText}`);
          }
          
          resumeContent = contentSections.join('\n\n');
          
          // Store the created content back in the resumeData object
          resumeData.resume_content = resumeContent;
          
          // Save the updated resumeData back to the file to avoid regenerating next time
          fs.writeFileSync(RESUME_DATA_PATH, JSON.stringify(resumeData, null, 2), "utf8");
          console.log("Updated resume_content in config file");
        } else {
          // Use the existing resume_content field
          resumeContent = resumeData.resume_content;
          console.log("Using existing resume_content from config file");
        }
      } catch (error) {
        console.error("Error loading resume data from config file:", error);
        throw new Error("Failed to load resume data from config file");
      }
    }

    // Initialize the feature extractor
    await initializeFeatureExtractor();

    // Split content into sections and chunks
    const sections = resumeContent
      .split(/^#+ /m)
      .filter((section) => section.trim().length > 0)
      .map((section) => section.trim());

    // Process chunks for vectorization
    const chunks = [];
    const metadata = [];

    for (const section of sections) {
      // Get section title (first line)
      const lines = section.split("\n");
      const title = lines[0].trim();

      // Split section into smaller chunks (paragraphs)
      const sectionChunks = section
        .split(/\n\n+/)
        .filter((chunk) => chunk.trim().length > 0);

      // Store each chunk with its metadata
      sectionChunks.forEach((chunk) => {
        chunks.push(chunk);
        metadata.push({
          text: chunk,
          section: title,
          fullSection: section,
        });
      });
    }

    console.log(`Created ${chunks.length} text chunks from resume`);

    // Generate embeddings for all chunks
    console.log("Generating embeddings using local model...");

    // Process chunks in batches to avoid memory issues
    const batchSize = 10;
    const batches = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      batches.push(chunks.slice(i, i + batchSize));
    }

    // Process each batch
    const embeddingResults = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i + 1}/${batches.length}...`);

      // Generate embeddings for this batch
      const batchEmbeddings = await Promise.all(
        batch.map(async (text) => {
          try {
            return await getEmbedding(text);
          } catch (error) {
            console.error(
              `Error generating embedding for chunk: ${error.message}`
            );
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
    console.log("Vector store initialized successfully with local embeddings");
    return true;
  } catch (error) {
    console.error("Error initializing vector store:", error);
    return false;
  }
}

/**
 * Find the most similar documents to a query
 * @param {string} query - The search query
 * @param {number} topK - Number of results to return
 * @returns {Array} - Array of relevant documents with their similarity scores
 */
export async function similaritySearch(query, topK = DEFAULT_TOP_K) {
  if (!initialized) {
    throw new Error("Vector store not initialized");
  }

  try {
    // Generate embedding for the query
    const queryEmbedding = await getEmbedding(query);

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
      .filter((result) => result.score > MIN_SIMILARITY_SCORE);

    // Return documents with their similarity scores
    return topResults.map((result) => ({
      ...documents[result.index],
      similarity: result.score,
    }));
  } catch (error) {
    console.error("Error in similarity search:", error);
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
