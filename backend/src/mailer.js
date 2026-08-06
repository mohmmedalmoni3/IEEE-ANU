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
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      margin: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: linear-gradient(135deg, #0066cc 0%, #004499 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      font-size: 32px;
      font-weight: 700;
      margin: 0;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    }
    .header p {
      color: #e0e0e0;
      font-size: 16px;
      margin: 10px 0 0 0;
    }
    .logo {
      width: 80px;
      height: 80px;
      background: #ffffff;
      border-radius: 50%;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }
    .logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .content {
      padding: 40px 30px;
      background: #ffffff;
    }
    .content h2 {
      color: #333333;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;
      text-align: center;
    }
    .content p {
      color: #555555;
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 15px;
    }
    .content strong {
      color: #0066cc;
      font-weight: 600;
    }
    .otp-code {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 20px;
      border-radius: 15px;
      text-align: center;
      margin: 30px 0;
      border: 2px solid #0066cc;
    }
    .otp-code span {
      font-size: 36px;
      font-weight: 700;
      color: #0066cc;
      letter-spacing: 8px;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #0066cc 0%, #004499 100%);
      color: #ffffff;
      padding: 15px 40px;
      border-radius: 30px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      box-shadow: 0 4px 15px rgba(0, 102, 204, 0.3);
      transition: all 0.3s ease;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 102, 204, 0.4);
    }
    .info-box {
      background: #f8f9fa;
      border-right: 4px solid #0066cc;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .info-box p {
      margin: 0;
      color: #555555;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .footer p {
      color: #777777;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .footer a {
      color: #0066cc;
      text-decoration: none;
      font-weight: 600;
    }
    .social-links {
      margin-top: 20px;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #0066cc;
      text-decoration: none;
      font-size: 20px;
    }
    @media only screen and (max-width: 600px) {
      body {
        padding: 10px;
      }
      .header {
        padding: 30px 20px;
      }
      .header h1 {
        font-size: 24px;
      }
      .content {
        padding: 30px 20px;
      }
      .otp-code span {
        font-size: 28px;
        letter-spacing: 4px;
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
