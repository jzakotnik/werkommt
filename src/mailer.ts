import nodemailer from 'nodemailer';
import { Absage } from './store';

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

export function createMailer(smtp: SmtpConfig) {
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.password,
    },
  });

  async function sendAbsageEmail(absage: Absage, trainerEmail: string): Promise<void> {
    const zeitpunkt = absage.timestamp.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; max-width: 500px; margin: 0 auto; padding: 20px; }
    .header { background: #e85d04; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #ddd; border-top: none; }
    .kind { font-size: 1.4em; font-weight: bold; color: #e85d04; margin: 10px 0; }
    .meta { color: #666; font-size: 0.9em; margin-top: 15px; }
    .training-info { background: white; border-left: 4px solid #e85d04; padding: 10px 15px; margin: 15px 0; border-radius: 0 4px 4px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h2 style="margin:0">🏓 Trainings-Absage</h2>
  </div>
  <div class="content">
    <p>Hallo ${absage.trainerName},</p>
    <p>folgendes Kind wurde für das Training abgemeldet:</p>
    <div class="kind">🧒 ${absage.kindName}</div>
    <div class="training-info">
      <strong>Training:</strong> ${absage.trainingDate}
    </div>
    <div class="meta">
      Absage eingetragen um ${zeitpunkt} Uhr
    </div>
    <hr style="border:none;border-top:1px solid #ddd;margin:20px 0">
    <p style="font-size:0.85em;color:#999">
      Diese Nachricht wurde automatisch vom Absagen-System gesendet.
    </p>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: smtp.from,
      to: trainerEmail,
      subject: `Absage: ${absage.kindName} – ${absage.trainingDate}`,
      html,
    });

    console.log(`[Mail] Sent to ${trainerEmail} for ${absage.kindName}`);
  }

  return { sendAbsageEmail };
}
