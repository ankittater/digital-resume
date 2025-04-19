import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create a transporter with Brevo SMTP
const createTransporter = () => {
  // Check if the required environment variables are set
  if (!process.env.BREVO_SMTP_KEY) {
    console.error(
      "Brevo configuration missing! Please set BREVO_SMTP_KEY environment variable."
    );
    return null;
  }

  // Create and return the transporter
  return nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: "8aea83001@smtp-brevo.com",
      pass: process.env.BREVO_SMTP_KEY,
    },
  });
};

/**
 * Send an email using the configured transporter
 * @param {string} name - Sender's name
 * @param {string} email - Sender's email
 * @param {string} message - Message content
 * @returns {Promise<boolean>} - Success status
 */
export const sendContactEmail = async (name, email, message) => {
  try {
    // Create the transporter
    const transporter = createTransporter();
    if (!transporter) {
      return false;
    }

    // Prepare the email
    const mailOptions = {
      from: '"Resume Website Contact" <hello@ankittater.com>',
      to: "hello@ankittater.com", // Recipient email
      replyTo: email, // Allow replying directly to the sender
      subject: `New Contact Message from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <div style="padding: 15px; background-color: #f8f9fa; border-left: 4px solid #0056b3;">
          ${message.replace(/\n/g, "<br>")}
        </div>
        <p style="color: #666; margin-top: 20px; font-size: 12px;">
          This email was sent from your resume website contact form.
        </p>
      `,
      text: `
        New Contact Form Submission
        ---------------------------
        Name: ${name}
        Email: ${email}
        
        Message:
        ${message}
        
        This email was sent from your resume website contact form.
      `,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

export default {
  sendContactEmail,
};
