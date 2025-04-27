import express from "express";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import fs from "fs";
import { initializeQASystem, askQuestion } from "./utils/qaSystem.js";
import { sendContactEmail } from "./utils/emailService.js";

// Configure environment variables
dotenv.config();

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Load resume data from JSON file
const loadResumeData = () => {
  try {
    const resumeDataPath = path.join(__dirname, "config", "resume-data.json");
    const resumeData = JSON.parse(fs.readFileSync(resumeDataPath, "utf8"));
    return resumeData;
  } catch (error) {
    console.error("Error loading resume data from JSON:", error);
    return {};
  }
};

// Initialize the QA system
console.log("Initializing QA System...");

// Start server first, then initialize the QA system
const PORT = process.env.PORT || 9000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(
    `Visit http://localhost:${PORT} to ask questions about the resume`
  );

  // Initialize QA system after server starts
  initializeQASystem()
    .then((success) => {
      if (!success) {
        console.warn(
          "Warning: QA System initialization had issues. Some features may not work correctly."
        );
      } else {
        console.log("QA System initialization completed successfully.");
      }
    })
    .catch((error) => {
      console.error("Fatal error initializing QA System:", error);
    });
});

// Routes
app.get("/", (req, res) => {
  // Load resume data and pass it to the template
  const resumeData = loadResumeData();
  res.render("index", { resumeData });
});

app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    console.log(`Received question: "${question}"`);
    const answer = await askQuestion(question);
    console.log(`Generated answer (${answer.length} chars)`);

    res.json({ answer });
  } catch (error) {
    console.error("Error processing question:", error);
    res.status(500).json({
      error: "An error occurred while processing your question",
      details: error.message,
    });
  }
});

app.post("/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate input
    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required" });
    }

    // Simple email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid email format" });
    }

    console.log(`Received contact form submission from: ${name} <${email}>`);

    // Send the email
    const success = await sendContactEmail(name, email, message);

    if (success) {
      res.json({
        success: true,
        message: "Your message has been sent successfully!",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to send email. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Error processing contact form:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while processing your request",
    });
  }
});

// Handle graceful shutdown
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

function gracefulShutdown() {
  console.log("Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
}
