import { Admin } from "@prisma/client";
import nodemailer from "nodemailer";
import { Logger } from "winston";
import {
  getAdminApprovalEmailTemplate,
  getAdminApprovedEmailTemplate,
  getEasterEggWelcomeEmailTemplate,
  getTenantInvitationEmailTemplate,
} from "./email.service.templates.js";
import { generateAdminVerificationToken } from "./jwt.service.js";
import { getAppSecrets } from "./secrets.service.js";

const notificationEmail = process.env.WAITLIST_NOTIFICATION_EMAIL;
const env = process.env.ENV || "dev";
const baseUrl = process.env.CONSOLE_URL || "http://localhost:4200";
const smtpPort = process.env.SMTP_PORT || "456";

export const sendAddToWaitlistEmail = async (logger: Logger, pendingAdmin: Admin) => {
  if (!notificationEmail) {
    return true;
  }

  const transporter = await createTransporter();

  logger.debug("Sending admin approval request email", {
    targetEmail: notificationEmail,
    adminEmail: pendingAdmin.email,
  });
  try {
    const verificationToken = await generateAdminVerificationToken(pendingAdmin.id);
    const verificationLink = `${baseUrl}/verify-admin?token=${verificationToken}`;

    await transporter.sendMail({
      from: `agentpass-${env}@ownid.com`,
      to: notificationEmail,
      subject: `AgentPass ${env}: New Admin Approval Required`,
      html: getAdminApprovalEmailTemplate(pendingAdmin.email, verificationLink),
    });
    return true;
  } catch (error) {
    logger.error("Failed to send admin approval request email", error);
    return false;
  }
};

export const sendAdminApprovedNotification = async (logger: Logger, admin: Admin, isEasterEgg = false) => {
  const transporter = await createTransporter();

  logger.debug("Sending admin approved notification email", {
    adminEmail: admin.email,
    isEasterEgg,
  });

  try {
    await transporter.sendMail({
      from: `agentpass-${env}@ownid.com`,
      to: admin.email,
      subject: isEasterEgg ? `🚀 Welcome to AgentPass - Rocket Launch Detected!` : `You're in! Welcome to AgentPass`,
      html: isEasterEgg ? getEasterEggWelcomeEmailTemplate(baseUrl) : getAdminApprovedEmailTemplate(baseUrl),
    });
    return true;
  } catch (error) {
    logger.error("Failed to send admin approved notification email", error);
    return false;
  }
};

// Easter egg welcome email is now handled by sendAdminApprovedNotification with isEasterEgg=true

export const sendTenantInvitationEmail = async (
  logger: Logger,
  to: string,
  inviter: string,
  tenantName: string,
  invitationLink: string,
  role: string,
  expiresAt: Date,
) => {
  const transporter = await createTransporter();

  logger.debug("Sending tenant invitation email", {
    to,
    inviter,
    tenantName,
    invitationLink,
    role,
    expiresAt,
  });

  try {
    await transporter.sendMail({
      from: `agentpass-${env}@ownid.com`,
      to,
      subject: `You're invited to join ${tenantName} on AgentPass`,
      html: getTenantInvitationEmailTemplate(inviter, tenantName, role, invitationLink, expiresAt),
    });
    return true;
  } catch (error) {
    logger.error("Failed to send tenant invitation email", error);
    return false;
  }
};

const createTransporter = async () => {
  const appSecrets = await getAppSecrets();
  return nodemailer.createTransport({
    host: appSecrets.smtpHost,
    port: Number(appSecrets.smtpPort),
    secure: appSecrets.smtpPort === smtpPort,
    auth: {
      user: appSecrets.smtpUsername,
      pass: appSecrets.smtpPassword,
    },
  });
};
