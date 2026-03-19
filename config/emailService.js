import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(to, subject, html, text) {
  try {
    if (!to || !subject || (!html && !text)) {
      throw new Error("Missing required email parameters");
    }

    const msg = {
      to,
      from: process.env.EMAIL_USER,
      subject,
      html,   // ✅ correct
      text,   // optional
    };

    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error("SendGrid error:", error.response?.body || error.message);
    return { success: false };
  }
}

export { sendEmail };