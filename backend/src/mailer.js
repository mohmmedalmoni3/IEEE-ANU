import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.MAIL_FROM || "IEEE ANU <notifications@ieeeanu.app>";

let resendClient = null;

if (resendApiKey) {
  resendClient = new Resend(resendApiKey);
}

export function hasSmtpConfig() {
  return Boolean(resendApiKey);
}

export async function verifyMailTransport() {
  if (!resendClient) {
    throw new Error("Resend غير مضبوط. أضف RESEND_API_KEY في backend/.env حتى تصل الرسائل إلى البريد فعلياً.");
  }
  try {
    await resendClient.domains.list();
  } catch (error) {
    throw new Error(`فشل الاتصال بـ Resend: ${error.message}`);
  }
}

export async function sendMail({ to, subject, text, html, requireDelivery = false }) {
  if (!to) return null;

  if (!resendClient) {
    if (requireDelivery) {
      throw new Error("Resend غير مضبوط، لذلك لا يمكن ضمان وصول الرسالة إلى البريد.");
    }
    console.log("[mail preview]", { to, subject, text });
    return null;
  }

  try {
    const { data, error } = await resendClient.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      html: getEmailTemplate(html)
    });

    if (error) {
      console.error("[Resend API Error]", JSON.stringify(error, null, 2));
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("[Resend Send Error]", error.message, error.stack);
    throw new Error(`فشل إرسال البريد: ${error.message}`);
  }
}

function getEmailTemplate(content) {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IEEE ANU</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      padding: 40px 20px;
      margin: 0;
      min-height: 100vh;
    }
    .email-container {
      max-width: 650px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
    }
    .header {
      background: linear-gradient(135deg, #0066cc 0%, #004499 50%, #003366 100%);
      padding: 50px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: pulse 4s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    .header h1 {
      color: #ffffff;
      font-size: 36px;
      font-weight: 800;
      margin: 0;
      text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      position: relative;
      z-index: 1;
    }
    .header p {
      color: #e8e8e8;
      font-size: 18px;
      margin: 12px 0 0 0;
      font-weight: 400;
      position: relative;
      z-index: 1;
    }
    .logo {
      width: 100px;
      height: 100px;
      background: #ffffff;
      border-radius: 50%;
      margin: 0 auto 25px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      position: relative;
      z-index: 1;
      border: 4px solid rgba(255, 255, 255, 0.3);
    }
    .logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .content {
      padding: 50px 45px;
      background: #ffffff;
    }
    .content h2 {
      color: #1a1a2e;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 25px;
      text-align: center;
      line-height: 1.4;
    }
    .content p {
      color: #4a4a4a;
      font-size: 17px;
      line-height: 2;
      margin-bottom: 20px;
      font-weight: 400;
    }
    .content strong {
      color: #0066cc;
      font-weight: 700;
    }
    .otp-code {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 35px 25px;
      border-radius: 20px;
      text-align: center;
      margin: 35px 0;
      border: 3px solid #0066cc;
      box-shadow: 0 8px 25px rgba(0, 102, 204, 0.15);
    }
    .otp-code span {
      font-size: 42px;
      font-weight: 800;
      color: #0066cc;
      letter-spacing: 12px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
      font-family: 'Cairo', sans-serif;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #0066cc 0%, #004499 100%);
      color: #ffffff;
      padding: 18px 50px;
      border-radius: 35px;
      text-decoration: none;
      font-weight: 700;
      font-size: 17px;
      margin: 25px 0;
      box-shadow: 0 6px 20px rgba(0, 102, 204, 0.35);
      transition: all 0.3s ease;
      font-family: 'Cairo', sans-serif;
    }
    .button:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0, 102, 204, 0.45);
    }
    .info-box {
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-right: 5px solid #0066cc;
      padding: 25px;
      margin: 25px 0;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    }
    .info-box p {
      margin: 0;
      color: #4a4a4a;
      font-size: 16px;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #e0e0e0, transparent);
      margin: 35px 0;
    }
    .footer {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 40px;
      text-align: center;
      border-top: 1px solid #dee2e6;
    }
    .footer p {
      color: #6c757d;
      font-size: 15px;
      margin-bottom: 12px;
      font-weight: 400;
    }
    .footer a {
      color: #0066cc;
      text-decoration: none;
      font-weight: 700;
      transition: color 0.3s ease;
    }
    .footer a:hover {
      color: #004499;
    }
    .social-links {
      margin-top: 25px;
    }
    .social-links a {
      display: inline-block;
      margin: 0 12px;
      color: #0066cc;
      text-decoration: none;
      font-size: 24px;
      transition: transform 0.3s ease;
    }
    .social-links a:hover {
      transform: scale(1.2);
    }
    .highlight {
      background: linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%);
      padding: 20px;
      border-radius: 12px;
      margin: 25px 0;
      border: 2px solid #ffc107;
    }
    .highlight p {
      margin: 0;
      color: #856404;
      font-size: 15px;
      font-weight: 600;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 20px 10px;
      }
      .header {
        padding: 35px 25px;
      }
      .header h1 {
        font-size: 28px;
      }
      .header p {
        font-size: 16px;
      }
      .content {
        padding: 35px 25px;
      }
      .content h2 {
        font-size: 24px;
      }
      .content p {
        font-size: 16px;
      }
      .otp-code {
        padding: 25px 20px;
      }
      .otp-code span {
        font-size: 32px;
        letter-spacing: 6px;
      }
      .button {
        padding: 15px 35px;
        font-size: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">
        <img src="${process.env.APP_BASE_URL || 'https://ieeeanu.app'}/logo.png" alt="IEEE ANU Logo" />
      </div>
      <h1>IEEE ANU</h1>
      <p>فرع جامعة عجلون الوطنية</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>تم إرسال هذه الرسالة من IEEE ANU</p>
      <p>إذا لم تطلب هذا الإجراء، يرجى تجاهل هذه الرسالة</p>
      <div class="social-links">
        <a href="#">🌐</a>
        <a href="#">📧</a>
        <a href="#">📱</a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendBatchEmails({ to, subject, text, html }) {
  if (!resendClient) {
    throw new Error("Resend غير مضبوط.");
  }

  if (!to || !to.length) {
    return { sentCount: 0, failedCount: 0, errors: [] };
  }

  // Resend supports up to 100 recipients per batch
  const batchSize = 100;
  const batches = [];
  for (let i = 0; i < to.length; i += batchSize) {
    batches.push(to.slice(i, i + batchSize));
  }

  let sentCount = 0;
  let failedCount = 0;
  const errors = [];

  for (const batch of batches) {
    try {
      const { data, error } = await resendClient.emails.send({
        from: fromEmail,
        to: batch,
        subject,
        text,
        html: getEmailTemplate(html)
      });

      if (error) {
        console.error("[Resend Batch API Error]", JSON.stringify(error, null, 2), "Batch:", batch);
        failedCount += batch.length;
        errors.push({ batch, error: error.message });
      } else {
        sentCount += batch.length;
      }
    } catch (error) {
      console.error("[Resend Batch Send Error]", error.message, error.stack, "Batch:", batch);
      failedCount += batch.length;
      errors.push({ batch, error: error.message });
    }
  }

  return { sentCount, failedCount, errors };
}

export async function notifyAdminsNewApplication(application, adminEmails) {
  if (!adminEmails.length) return;

  const subject = `طلب انضمام جديد - ${application.fullName}`;
  const skills = (application.skills || []).join("، ") || "غير محدد";
  const text = [
    "وصل طلب انضمام جديد إلى IEEE ANU.",
    "",
    `الاسم: ${application.fullName}`,
    `البريد الجامعي: ${application.universityEmail}`,
    `العمر: ${application.age}`,
    `الدولة: ${application.country}`,
    `الخبرة: ${application.experience}`,
    `المهارات: ${skills}`,
    "",
    `سبب الانضمام: ${application.whyJoin}`
  ].join("\n");

  const htmlContent = `
    <h2>طلب انضمام جديد</h2>
    <p>وصل طلب انضمام جديد إلى IEEE ANU</p>
    <div class="info-box">
      <p><strong>الاسم:</strong> ${application.fullName}</p>
      <p><strong>البريد الجامعي:</strong> ${application.universityEmail}</p>
      <p><strong>العمر:</strong> ${application.age}</p>
      <p><strong>الدولة:</strong> ${application.country}</p>
      <p><strong>الخبرة:</strong> ${application.experience}</p>
      <p><strong>المهارات:</strong> ${skills}</p>
    </div>
    <p><strong>سبب الانضمام:</strong></p>
    <p>${application.whyJoin}</p>
  `;

  await sendMail({
    to: adminEmails.join(","),
    subject,
    text,
    html: htmlContent
  });
}

export async function notifyApplicantStatus(application) {
  const statusMessages = {
    "مقبول": "نبارك لك قبول طلبك في IEEE ANU. سيتم التواصل معك للخطوات التالية.",
    "مرفوض": "نشكرك على اهتمامك بالانضمام إلى IEEE ANU. لم يتم قبول الطلب في هذه المرحلة.",
    "بحاجة لمقابلة": "طلبك يحتاج إلى مقابلة قصيرة. سيتم التواصل معك لتحديد التفاصيل.",
    "إعادة المقابلة": "تم تحديد طلبك لإعادة المقابلة. سيتم التواصل معك لتحديد موعد جديد.",
    "قيد المراجعة": "تمت إعادة طلبك إلى مرحلة المراجعة."
  };

  const message = statusMessages[application.status] || `تم تحديث حالة طلبك إلى: ${application.status}`;
  const note = application.adminNote ? `\n\nملاحظة الإدارة: ${application.adminNote}` : "";

  const htmlContent = `
    <h2>تحديث حالة طلبك</h2>
    <p>مرحبا <strong>${application.fullName}</strong>،</p>
    <p>${message}</p>
    ${application.adminNote ? `
    <div class="info-box">
      <p><strong>ملاحظة الإدارة:</strong></p>
      <p>${application.adminNote}</p>
    </div>
    ` : ""}
  `;

  await sendMail({
    to: application.universityEmail,
    subject: "تحديث حالة طلبك - IEEE ANU",
    text: [`مرحبا ${application.fullName},`, "", message, note].join("\n"),
    html: htmlContent
  });
}
