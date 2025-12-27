import { Resend } from "resend";
import nodemailer from "nodemailer";

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const createGmailTransporter = () => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail(payload: EmailPayload) {
  const from =
    process.env.RESEND_FROM_EMAIL ||
    (process.env.GMAIL_USER ? `CodeCraft Academy <${process.env.GMAIL_USER}>` : "CodeCraft Academy <onboarding@resend.dev>");

  let emailSent = false;
  let method: "resend" | "gmail" | "none" = "none";

  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      if (!error && data) {
        emailSent = true;
        method = "resend";
      }
    } catch {
      // ignore
    }
  }

  if (!emailSent) {
    const gmailTransporter = createGmailTransporter();
    if (gmailTransporter) {
      try {
        await gmailTransporter.sendMail({
          from,
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        });
        emailSent = true;
        method = "gmail";
      } catch {
        // ignore
      }
    }
  }

  return { success: emailSent, method };
}
