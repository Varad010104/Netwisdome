const nodemailer = require('nodemailer');
const Batch = require('../models/Batch');
require('dotenv').config();

// ========================================================
// 1. CREATE TRANSPORTER
// ========================================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const isValidEmail = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ========================================================
// 2. VERIFY SMTP CONNECTION
// ========================================================
const verifySMTPConnection = async () => {
  try {
    console.log("-----------------------------------------");
    console.log("📧 Verifying SMTP Connection...");
    console.log("👤 SMTP USER:", process.env.SMTP_USER);
    await transporter.verify();
    console.log("✅ SMTP Connection Successful!");
    console.log("-----------------------------------------");
    return true;
  } catch (error) {
    console.error("❌ SMTP Connection Failed:", error.message);
    console.log("-----------------------------------------");
    return false;
  }
};

// ========================================================
// 3. BUILD PROFESSIONAL HTML EMAIL TEMPLATE
// ========================================================
const buildAssignmentEmailTemplate = (studentName, assignment) => {
  const ctaLink = `${FRONTEND_URL}/?redirect=assignments`;
  const typeBadgeColor = assignment.type.toLowerCase() === 'mcq' ? '#10B981' : '#F59E0B'; 
  
  const formattedStartDate = assignment.startDate ? new Date(assignment.startDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
  const formattedDueDate = assignment.lastDate ? new Date(assignment.lastDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

  return `
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
          body { margin: 0; padding: 0; font-family: 'Inter', 'Segoe UI', sans-serif; background-color: #f3f4f6; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 0.5px; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; font-weight: 600; }
          
          /* Glassmorphism/Modern Card Style */
          .assignment-card { 
              background: #f8fafc; 
              border: 1px solid #e2e8f0; 
              border-radius: 12px; 
              padding: 25px; 
              margin-bottom: 30px;
          }
          .title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; gap:2px; }
          .assignment-title { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; }
          .badge { background: ${typeBadgeColor}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-left: 10px; }
          
          .details-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
          .detail-item { font-size: 15px; }
          .detail-label { color: #64748b; font-weight: 600; width: 100px; display: inline-block; }
          .detail-value { color: #334155; font-weight: 500; }
          .due-date { color: #ef4444; font-weight: 700; }
          
          .description-box { margin-top: 15px; padding-top: 15px; border-top: 1px dashed #cbd5e1; font-size: 14px; color: #475569; line-height: 1.5; }

          .btn-container { text-align: center; margin-top: 35px; }
          .btn { background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.25); }
          
          .footer { background: #1e293b; padding: 25px; text-align: center; }
          .footer p { color: #94a3b8; font-size: 13px; margin: 5px 0; }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>Netwisdome LMS</h1>
          </div>
          <div class="content">
              <div class="greeting">Hello ${studentName},</div>
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                  A new assignment has been published for your batch <strong>(${assignment.batchName})</strong>. Please find the details below.
              </p>

              <div class="assignment-card">
                  <div class="title-row">
                      <h2 class="assignment-title">${assignment.title}</h2>
                      <span class="badge"> ${assignment.type}</span>
                  </div>
                  
                  <div class="details-grid">
                      <div class="detail-item">
                          <span class="detail-label">Total Marks:</span>
                          <span class="detail-value">${assignment.totalMarks} Points</span>
                      </div>
                      <div class="detail-item">
                          <span class="detail-label">Start Date:</span>
                          <span class="detail-value">${formattedStartDate}</span>
                      </div>
                      <div class="detail-item">
                          <span class="detail-label">Due Date:</span>
                          <span class="detail-value due-date">${formattedDueDate}</span>
                      </div>
                  </div>

                  ${assignment.description ? `
                  <div class="description-box">
                      <strong>Description:</strong><br/>
                      ${assignment.description}
                  </div>` : ''}
                  
                  ${assignment.rubric ? `
                  <div class="description-box">
                      <strong>Rubric:</strong><br/>
                      ${assignment.rubric}
                  </div>` : ''}
              </div>

              <div class="btn-container">
                  <a href="${ctaLink}" class="btn">View Assignment</a>
              </div>
              <p style="margin-top:12px;color:#64748b;font-size:12px;word-break:break-all;">
                Open manually if button fails: ${ctaLink}
              </p>
          </div>
          <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Netwisdome LMS. All rights reserved.</p>
              <p>You are receiving this because you are enrolled in a Netwisdome batch.</p>
          </div>
      </div>
  </body>
  </html>
  `;
};

const buildEnrollmentEmailTemplate = (studentName, enrollment) => {
  const ctaLink = FRONTEND_URL;
  const safeName = studentName || 'Student';
  const safeEmail = enrollment?.email || 'N/A';
  const safePassword = enrollment?.password || 'N/A';
  const safeBatch = enrollment?.batchName || 'Unassigned';
  const enrolledOn = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return `
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
          body { margin: 0; padding: 0; font-family: 'Inter', 'Segoe UI', sans-serif; background-color: #f3f4f6; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 0.5px; }
          .content { padding: 36px 30px; }
          .greeting { font-size: 18px; color: #1f2937; margin-bottom: 14px; font-weight: 600; }
          .subtext { color: #475569; font-size: 16px; line-height: 1.7; margin: 0 0 22px; }
          .credentials-card {
              background: rgba(248, 250, 252, 0.9);
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 24px;
          }
          .card-title {
              margin: 0 0 16px;
              font-size: 18px;
              color: #0f172a;
              font-weight: 700;
          }
          .detail-item { margin: 8px 0; font-size: 15px; }
          .detail-label { color: #64748b; font-weight: 600; width: 140px; display: inline-block; }
          .detail-value { color: #0f172a; font-weight: 600; word-break: break-word; }
          .btn-container { text-align: center; margin-top: 8px; }
          .btn {
              background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
              color: #ffffff !important;
              text-decoration: none;
              padding: 14px 30px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              display: inline-block;
              box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25);
          }
          .fallback { margin-top: 12px; color: #64748b; font-size: 12px; word-break: break-all; text-align: center; }
          .footer { background: #0f172a; padding: 22px; text-align: center; }
          .footer p { color: #94a3b8; font-size: 12px; margin: 4px 0; }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1>Welcome to Netwisdome LMS</h1>
          </div>
          <div class="content">
              <p class="greeting">Hello ${safeName},</p>
              <p class="subtext">
                  Welcome to Netwisdome LMS. Your student account has been successfully created.
                  Use the credentials below to access your dashboard and start learning.
              </p>

              <div class="credentials-card">
                  <p class="card-title">Login Credentials</p>
                  <p class="detail-item"><span class="detail-label">Email Address:</span><span class="detail-value">${safeEmail}</span></p>
                  <p class="detail-item"><span class="detail-label">Password:</span><span class="detail-value">${safePassword}</span></p>
                  <p class="detail-item"><span class="detail-label">Assigned Batch:</span><span class="detail-value">${safeBatch}</span></p>
                  <p class="detail-item"><span class="detail-label">Enrollment Date:</span><span class="detail-value">${enrolledOn}</span></p>
              </div>

              <div class="btn-container">
                  <a href="${ctaLink}" class="btn">Login to LMS</a>
              </div>
              <p class="fallback">If button does not open, use this URL: ${ctaLink}</p>
          </div>
          <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Netwisdome LMS. All rights reserved.</p>
              <p>This is an automated enrollment message.</p>
          </div>
      </div>
  </body>
  </html>`;
};

// ========================================================
// 4. SEND INDIVIDUAL EMAILS (PROMISE.ALLSETTLED)
// ========================================================
const sendAssignmentPublishedEmails = async (students, assignmentData) => {
  const report = { enabled: true, totalRecipients: students.length, sent: 0, failed: 0, failures: [] };

  if (!Array.isArray(students) || students.length === 0) {
    console.log("⚠️ No students found to email.");
    report.enabled = false;
    return report;
  }

  const hasSMTPConfig = Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
  if (!hasSMTPConfig) {
    report.enabled = false;
    report.failed = report.totalRecipients;
    report.failures.push({ email: 'SYSTEM', error: 'SMTP is not configured in backend/.env' });
    console.error('SMTP config missing. Check SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS.');
    return report;
  }

  const isConnected = await verifySMTPConnection();
  if (!isConnected) {
    report.enabled = false;
    report.failed = report.totalRecipients;
    report.failures.push({ email: 'SYSTEM', error: 'SMTP connection verify failed' });
    return report;
  }

  console.log(`🚀 Starting individual email dispatch to ${students.length} students...`);

  // Map each student to an individual transporter.sendMail promise
  const emailPromises = students.map(student => {
    const recipient = String(student?.email || '').trim();
    if (!recipient || !isValidEmail(recipient)) {
      return Promise.resolve({
        email: recipient || '',
        success: false,
        error: new Error('Invalid recipient email')
      });
    }
    const htmlContent = buildAssignmentEmailTemplate(student.name || 'Student', assignmentData);
    
    const mailOptions = {
      from: `"Netwisdome" <${process.env.SMTP_USER}>`,
      replyTo: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: recipient,
      subject: `📚 New Assignment: ${assignmentData.title}`,
      html: htmlContent
    };

    console.log(`📩 Preparing mail for: ${student.email}`);
    return transporter.sendMail(mailOptions)
      .then((info) => {
        const rejectedList = Array.isArray(info?.rejected) ? info.rejected : [];
        if (rejectedList.length > 0) {
          return {
            email: recipient,
            success: false,
            error: new Error(`Rejected by SMTP: ${rejectedList.join(', ')}`)
          };
        }
        return { email: recipient, success: true, info };
      })
      .catch((error) => ({ email: recipient, success: false, error }));
  });

  // Execute all promises in parallel, waiting for all to finish regardless of individual failures
  const results = await Promise.allSettled(emailPromises);

  // Tally the results
  results.forEach(result => {
    if (result.status === 'fulfilled' && result.value.success) {
      report.sent += 1;
    } else {
      report.failed += 1;
      const failedEmail = result.status === 'fulfilled' ? result.value.email : "Unknown";
      const errorMsg = result.status === 'fulfilled'
        ? (result.value?.error?.message || 'Unknown mail error')
        : String(result.reason || 'Unknown promise error');
      report.failures.push({ email: failedEmail, error: errorMsg });
      console.error(`❌ Failed to send to ${failedEmail}:`, errorMsg);
    }
  });

  console.log(`✅ Dispatch Complete! Sent: ${report.sent}/${report.totalRecipients}, Failed: ${report.failed}`);
  return report;
};

const sendStudentEnrollmentEmail = async (studentData = {}) => {
  const recipient = String(studentData?.email || '').trim();
  if (!recipient || !isValidEmail(recipient)) {
    throw new Error('Invalid student email for enrollment mail');
  }

  const hasSMTPConfig = Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
  if (!hasSMTPConfig) {
    throw new Error('SMTP is not configured in backend/.env');
  }

  let batchName = studentData?.batchName || 'Unassigned';
  if (!batchName && studentData?.batchId) {
    const batch = await Batch.findById(studentData.batchId).select('batchName').lean();
    batchName = batch?.batchName || 'Unassigned';
  }

  const html = buildEnrollmentEmailTemplate(studentData?.name || 'Student', {
    email: recipient,
    password: studentData?.password || '',
    batchName
  });

  console.log('?? Enrollment mail started');
  console.log('Recipient:', recipient);
  console.log('SMTP USER:', process.env.SMTP_USER);

  try {
    const info = await transporter.sendMail({
      from: `"Netwisdome" <${process.env.SMTP_USER}>`,
      replyTo: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: recipient,
      subject: '?? Welcome to Netwisdome LMS',
      html,
      text: `
Welcome to Netwisdome LMS

Email: ${recipient}
Password: ${studentData?.password || ''}
Batch: ${batchName}

Login URL:
${FRONTEND_URL}
`
    });

    const rejectedList = Array.isArray(info?.rejected) ? info.rejected : [];
    if (rejectedList.length > 0) {
      throw new Error(`Enrollment mail rejected by SMTP: ${rejectedList.join(', ')}`);
    }

    console.log('? Enrollment mail sent');
    console.log(info.response);
    console.log(info.messageId);
    return info;
  } catch (error) {
    console.error('? Enrollment mail error:', error);
    throw error;
  }
};

// ========================================================
// 5. EXPORT
// ========================================================
module.exports = {
  sendAssignmentPublishedEmails,
  sendStudentEnrollmentEmail,
  verifySMTPConnection
};
