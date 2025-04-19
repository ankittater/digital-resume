import express from "express";
import dotenv from "dotenv";
import { OpenAI } from "langchain/llms/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import path from "path";
import { fileURLToPath } from "url";
import {
  OPENAI_CHAT_MODEL,
  CHUNK_SIZE,
  CHUNK_OVERLAP,
  DEFAULT_TOP_K,
} from "./utils/config.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static("public"));
app.set("view engine", "ejs");

let vectorStore = null;

// Initialize the vector store
async function initializeVectorStore() {
  try {
    // Load the CV content
    const loader = new TextLoader(path.join(__dirname, "./resources/cv.md"));
    const docs = await loader.load();

    // Split the text into chunks
    const splitter = new CharacterTextSplitter({
      separator: "\n",
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });
    const splitDocs = await splitter.splitDocuments(docs);

    // Create vector store with OpenAI embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize in-memory vector store
    vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);

    console.log("Vector store initialized successfully");
    return vectorStore;
  } catch (error) {
    console.error("Error initializing vector store:", error);
    throw error;
  }
}

// Query the vector store
async function queryVectorStore(query) {
  if (!vectorStore) {
    throw new Error("Vector store not initialized");
  }

  try {
    // Search for relevant documents
    const results = await vectorStore.similaritySearch(query, DEFAULT_TOP_K);
    return results;
  } catch (error) {
    console.error("Error querying vector store:", error);
    throw error;
  }
}

// Initialize the OpenAI language model
const model = new OpenAI({
  modelName: OPENAI_CHAT_MODEL,
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7,
  maxTokens: 1024,
});

// Create the prompt template
const promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful AI assistant that answers questions about Ankit Tater's profile.
Use the following context to answer the question. If you don't know the answer, say you don't know.
Don't make up any information that's not in the context.

Context: {context}

Question: {question}

Answer: `);

// Create the chain
const chain = RunnableSequence.from([
  {
    context: async (input) => {
      const docs = await queryVectorStore(input.question);
      return docs.map((doc) => doc.pageContent).join("\n\n");
    },
    question: (input) => input.question,
  },
  promptTemplate,
  model,
  new StringOutputParser(),
]);

// Initialize vector store when the application starts
await initializeVectorStore();

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    const answer = await chain.invoke({
      question: question,
    });

    res.json({ answer });
  } catch (error) {
    console.error("Error processing question:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your question" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
