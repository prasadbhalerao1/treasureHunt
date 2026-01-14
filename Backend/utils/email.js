import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { getTeamIdEmailTemplate } from "./emailTemplates.js";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendTeamIdEmail = async (toEmail, teamName, teamId) => {
  try {
    const mailOptions = {
      from: '"TreasureHunt HQ" <noreply@treasurehunt.com>',
      to: toEmail,
      subject: "YOUR MISSION DETAIL: Team ID Assigned",
      html: getTeamIdEmailTemplate(teamName, teamId),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};
