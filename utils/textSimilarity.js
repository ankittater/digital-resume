import path from "path";
import { fileURLToPath } from "url";
import { DEFAULT_TOP_K, TEXT_MIN_SIMILARITY_SCORE } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory database of documents
let documents = [];
let initialized = false;

/**
 * Initialize the text similarity system
 * @param {string} resumeContent - Resume content as text
 * @returns {boolean} - Success status
 */
export async function initialize(resumeContent) {
  try {
    // Split content into sections
    const sections = resumeContent
      .split(/^#+ /m)
      .filter((section) => section.trim().length > 0)
      .map((section) => section.trim());

    // Process each section into chunks
    documents = [];
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
        // Extract keywords from the chunk
        const keywords = extractKeywords(chunk);

        documents.push({
          text: chunk,
          section: title,
          fullSection: section,
          keywords: keywords,
        });
      });
    }

    console.log(
      `Text similarity system initialized with ${documents.length} chunks`
    );
    initialized = true;
    return true;
  } catch (error) {
    console.error("Error initializing text similarity system:", error);
    return false;
  }
}

/**
 * Extract keywords from text
 * @param {string} text - Input text
 * @returns {Array} - Array of keywords
 */
function extractKeywords(text) {
  const normalizedText = text.toLowerCase();

  // Remove punctuation and split into words
  const words = normalizedText
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);

  // Remove common stopwords
  const stopwords = new Set([
    "the",
    "and",
    "for",
    "with",
    "was",
    "that",
    "are",
    "this",
    "have",
    "from",
    "has",
    "been",
    "were",
    "will",
    "their",
    "what",
    "about",
    "which",
  ]);

  return words.filter((word) => !stopwords.has(word));
}

/**
 * Calculate similarity between two sets of keywords
 * @param {Array} keywords1 - First set of keywords
 * @param {Array} keywords2 - Second set of keywords
 * @returns {number} - Similarity score (0-1)
 */
function calculateSimilarity(keywords1, keywords2) {
  // Count matching keywords
  let matches = 0;
  for (const word of keywords1) {
    if (keywords2.includes(word)) {
      matches++;
    }
  }

  // Calculate Jaccard similarity
  const union = new Set([...keywords1, ...keywords2]).size;
  return union > 0 ? matches / union : 0;
}

/**
 * Search for similar documents
 * @param {string} query - Search query
 * @param {number} topK - Number of results to return
 * @returns {Array} - Array of similar documents
 */
export async function search(query, topK = DEFAULT_TOP_K) {
  if (!initialized) {
    throw new Error("Text similarity system not initialized");
  }

  try {
    // Extract keywords from query
    const queryKeywords = extractKeywords(query);

    // Calculate similarity for each document
    const results = documents.map((doc) => {
      const similarity = calculateSimilarity(queryKeywords, doc.keywords);
      return { ...doc, similarity };
    });

    // Sort by similarity and get top K results
    return results
      .filter((doc) => doc.similarity > TEXT_MIN_SIMILARITY_SCORE)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  } catch (error) {
    console.error("Error in text similarity search:", error);
    throw error;
  }
}
