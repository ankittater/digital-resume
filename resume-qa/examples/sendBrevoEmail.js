// Example showing how to use the emailService with Brevo SMTP
const dotenv = require("dotenv");
const emailService = require("../utils/emailService");

// Load environment variables
dotenv.config();

async function sendTestEmail() {
  try {
    const name = "Test User";
    const email = "test@example.com";
    const message = "This is a test message sent via the contact form.";

    const result = await emailService.sendContactEmail(name, email, message);

    if (result) {
      console.log("Email sent successfully!");
    } else {
      console.log("Failed to send email.");
    }
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

// Run the test
sendTestEmail();

// To run this example:
// 1. Make sure you've set up the BREVO_SMTP_KEY in your .env file
// 2. Run this file with: node examples/sendBrevoEmail.js
