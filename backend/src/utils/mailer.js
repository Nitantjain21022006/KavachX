import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export const sendOTPEmail = async (to, otp) => {
  const fromEmail = process.env.BREVO_USER || 'alerts@cyber-resilience.com';

  try {
    const response = await axios.post(BREVO_API_URL, {
      sender: { name: "Cyber-Resilience", email: fromEmail },
      to: [{ email: to }],
      subject: "🔐 Your Verification Code",
      htmlContent: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2>Verify your account</h2>
                    <p>Use the following code to complete your registration:</p>
                    <h1 style="color: #3b82f6; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
                    <p>This code will expire in 10 minutes.</p>
                </div>
            `
    }, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ OTP Email sent via API:', response.data.messageId);
    return { success: true };
  } catch (err) {
    console.error('❌ Brevo API Error:', err.response?.data || err.message);
    return { success: false, error: err.message };
  }
};

export const sendResetPasswordEmail = async (to, token) => {
  const fromEmail = process.env.BREVO_USER || 'alerts@cyber-resilience.com';
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  try {
    await axios.post(BREVO_API_URL, {
      sender: { name: "Cyber-Resilience", email: fromEmail },
      to: [{ email: to }],
      subject: "🔑 Reset Your Password",
      htmlContent: `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2>Reset your password</h2>
                    <p>Click the button below to reset your password:</p>
                    <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a>
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
            `
    }, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    return { success: true };
  } catch (err) {
    console.error('❌ Reset Email failed:', err.response?.data || err.message);
    return { success: false, error: err.message };
  }
};

export const sendAlertEmail = async (to, alertData) => {
  const fromEmail = process.env.BREVO_USER || 'alerts@cyber-resilience.com';
  const { sector, severity, type, explanation } = alertData;

  try {
    await axios.post(BREVO_API_URL, {
      sender: { name: "Cyber-Resilience", email: fromEmail },
      to: [{ email: to }],
      subject: `🚨 [${severity}] Cyber Threat Alert - ${sector}`,
      textContent: `A ${severity} severity threat has been detected in the ${sector} sector.\n\nType: ${type}\nExplanation: ${explanation}`
    }, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error('❌ Alert Email failed:', err.response?.data || err.message);
  }
};

export const sendDossierEmail = async (to, sectorData) => {
  const fromEmail = process.env.BREVO_USER || 'alerts@cyber-resilience.com';
  const { sectorName, health, risk, incidents } = sectorData;
  const riskColor = risk === 'HIGH' ? '#ff003c' : risk === 'MEDIUM' ? '#ff9900' : '#39ff14';
  const healthColor = health > 80 ? '#39ff14' : health > 50 ? '#ff9900' : '#ff003c';
  const dateStr = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });

  try {
    await axios.post(BREVO_API_URL, {
      sender: { name: "KavachX Intelligence", email: fromEmail },
      to: [{ email: to }],
      subject: `📋 [KAVACHX] Sector Intelligence Dossier — ${sectorName}`,
      htmlContent: `
        <div style="font-family: 'Courier New', monospace; background: #020204; color: #ffffff; padding: 40px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(0,243,255,0.2); border-radius: 16px;">
          <div style="border-bottom: 1px solid rgba(0,243,255,0.15); padding-bottom: 20px; margin-bottom: 28px;">
            <div style="color: #00f3ff; font-size: 10px; font-weight: 900; letter-spacing: 0.4em; text-transform: uppercase; margin-bottom: 6px;">🛡️ KAVACHX // SECTOR INTELLIGENCE DOSSIER</div>
            <div style="color: rgba(0,243,255,0.4); font-size: 9px; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase;">CLEARANCE: ALPHA-4 · ${dateStr}</div>
          </div>

          <h1 style="font-size: 26px; font-weight: 900; color: #ffffff; font-style: italic; letter-spacing: -0.02em; margin: 0 0 24px 0; text-transform: uppercase;">${sectorName}</h1>

          <div style="display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 28px;">
            <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 16px; text-align: center; border: 1px solid rgba(255,255,255,0.06);">
              <div style="font-size: 9px; color: rgba(255,255,255,0.3); font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 8px;">Resilience</div>
              <div style="font-size: 24px; font-weight: 900; font-style: italic; color: ${healthColor};">${health}%</div>
            </div>
            <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 16px; text-align: center; border: 1px solid rgba(255,255,255,0.06);">
              <div style="font-size: 9px; color: rgba(255,255,255,0.3); font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 8px;">Risk Class</div>
              <div style="font-size: 24px; font-weight: 900; font-style: italic; color: ${riskColor};">${risk}</div>
            </div>
            <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 16px; text-align: center; border: 1px solid rgba(255,255,255,0.06);">
              <div style="font-size: 9px; color: rgba(255,255,255,0.3); font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 8px;">Anomalies</div>
              <div style="font-size: 24px; font-weight: 900; font-style: italic; color: #ff9900;">${incidents}</div>
            </div>
          </div>

          <div style="border-left: 2px solid rgba(0,243,255,0.3); padding-left: 16px; margin-bottom: 28px;">
            <div style="font-size: 9px; color: #00f3ff; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 8px;">Executive Summary</div>
            <p style="font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.6; margin: 0;">
              The <strong style="color: #ffffff;">${sectorName}</strong> domain is at
              <strong style="color: ${healthColor}; font-style: italic;">${health > 80 ? 'OPTIMAL RESILIENCE' : 'DEGRADED STATUS'}</strong>.
              ${incidents} active anomalies recorded. The Autonomous Resilience Engine is
              <em>${risk === 'HIGH' ? 'executing active-mitigation sequences' : 'maintaining passive synchronization'}</em>.
            </p>
          </div>

          <div style="background: rgba(0,243,255,0.04); border-radius: 12px; padding: 20px; border: 1px solid rgba(0,243,255,0.1); margin-bottom: 28px;">
            <div style="font-size: 9px; color: #00f3ff; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 12px;">Core Telemetry</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              ${[
                ['Encryption Layer', 'AES-256-GCM'],
                ['Auth Protocol', 'JWT + mTLS'],
                ['Packet Integrity', health > 80 ? 'VERIFIED' : 'DEGRADED'],
                ['Entropy (Enc)', '99.98%'],
              ].map(([k, v]) => `<tr><td style="padding: 6px 0; color: rgba(255,255,255,0.4); font-weight: 700; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.04);">${k}</td><td style="padding: 6px 0; color: #ffffff; font-weight: 900; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.04);">${v}</td></tr>`).join('')}
            </table>
          </div>

          <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; text-align: center;">
            <div style="font-size: 8px; color: rgba(255,255,255,0.15); font-weight: 900; text-transform: uppercase; letter-spacing: 0.5em;">
              CONFIDENTIAL — KAVACHX NEURAL SHIELD — ALPHA-4 CLEARANCE
            </div>
          </div>
        </div>
      `
    }, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Dossier email sent to:', to);
    return { success: true };
  } catch (err) {
    console.error('❌ Dossier Email failed:', err.response?.data || err.message);
    return { success: false, error: err.message };
  }
};

