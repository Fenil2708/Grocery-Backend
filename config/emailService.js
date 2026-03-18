import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(to, subject, html) {
  try {
    const msg = {
      to,
      from: process.env.EMAIL_USER, // verified email
      subject,
      html,
    };

    await sgMail.send(msg);

    return { success: true };
  } catch (error) {
    console.error("SendGrid error:", error);
    return { success: false };
  }
}

export { sendEmail };