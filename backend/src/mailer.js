import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.MAIL_FROM || "IEEE ANU <onboarding@resend.dev>";

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
      html
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw new Error(`فشل إرسال البريد: ${error.message}`);
  }
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
        html
      });

      if (error) {
        failedCount += batch.length;
        errors.push({ batch, error: error.message });
      } else {
        sentCount += batch.length;
      }
    } catch (error) {
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

  await sendMail({
    to: adminEmails.join(","),
    subject,
    text,
    html: `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>طلب انضمام جديد</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;font-family:'Cairo',Arial,sans-serif;background:#f5f7fa">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f5f7fa">
    <tr>
      <td style="padding:40px 20px">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          <tr>
            <td style="background:linear-gradient(135deg,#0066cc 0%,004080 100%);padding:40px;text-align:center">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700">IEEE ANU</h1>
              <p style="margin:10px 0 0;color:#ffffff;font-size:16px;opacity:0.9">طلب انضمام جديد</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding:20px;background:#f8f9fc;border-radius:12px;margin-bottom:20px">
                    <p style="margin:0 0 8px;color:#666;font-size:14px">الاسم الكامل</p>
                    <p style="margin:0;color:#1a1a2e;font-size:18px;font-weight:600">${application.fullName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px;background:#f8f9fc;border-radius:12px;margin-bottom:20px">
                    <p style="margin:0 0 8px;color:#666;font-size:14px">البريد الجامعي</p>
                    <p style="margin:0;color:#1a1a2e;font-size:18px;font-weight:600">${application.universityEmail}</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding:20px;background:#f8f9fc;border-radius:12px;width:48%">
                          <p style="margin:0 0 8px;color:#666;font-size:14px">العمر</p>
                          <p style="margin:0;color:#1a1a2e;font-size:18px;font-weight:600">${application.age}</p>
                        </td>
                        <td style="width:4%"></td>
                        <td style="padding:20px;background:#f8f9fc;border-radius:12px;width:48%">
                          <p style="margin:0 0 8px;color:#666;font-size:14px">الدولة</p>
                          <p style="margin:0;color:#1a1a2e;font-size:18px;font-weight:600">${application.country}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px;background:#f8f9fc;border-radius:12px;margin-bottom:20px">
                    <p style="margin:0 0 8px;color:#666;font-size:14px">الخبرة</p>
                    <p style="margin:0;color:#1a1a2e;font-size:18px;font-weight:600">${application.experience}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px;background:#f8f9fc;border-radius:12px;margin-bottom:20px">
                    <p style="margin:0 0 8px;color:#666;font-size:14px">المهارات</p>
                    <p style="margin:0;color:#1a1a2e;font-size:18px;font-weight:600">${skills}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px;background:#e8f4fd;border-radius:12px;border-right:4px solid #0066cc">
                    <p style="margin:0 0 8px;color:#0066cc;font-size:14px;font-weight:600">سبب الانضمام</p>
                    <p style="margin:0;color:#1a1a2e;font-size:16px;line-height:1.8">${application.whyJoin}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 40px;background:#f8f9fc;text-align:center">
              <p style="margin:0;color:#666;font-size:14px">هذه رسالة آلية من IEEE ANU</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
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

  const statusColors = {
    "مقبول": "#10b981",
    "مرفوض": "#ef4444",
    "بحاجة لمقابلة": "#f59e0b",
    "إعادة المقابلة": "#f59e0b",
    "قيد المراجعة": "#6366f1"
  };

  const statusColor = statusColors[application.status] || "#6366f1";

  await sendMail({
    to: application.universityEmail,
    subject: "تحديث حالة طلبك - IEEE ANU",
    text: [`مرحبا ${application.fullName},`, "", message, note].join("\n"),
    html: `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تحديث حالة طلبك</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;font-family:'Cairo',Arial,sans-serif;background:#f5f7fa">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f5f7fa">
    <tr>
      <td style="padding:40px 20px">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          <tr>
            <td style="background:linear-gradient(135deg,#0066cc 0%,004080 100%);padding:40px;text-align:center">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700">IEEE ANU</h1>
              <p style="margin:10px 0 0;color:#ffffff;font-size:16px;opacity:0.9">تحديث حالة طلبك</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding:30px;background:#f8f9fc;border-radius:12px;text-align:center;margin-bottom:30px">
                    <p style="margin:0 0 10px;color:#666;font-size:14px">حالة الطلب</p>
                    <p style="margin:0;color:${statusColor};font-size:24px;font-weight:700">${application.status}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px;background:#e8f4fd;border-radius:12px;border-right:4px solid #0066cc;margin-bottom:20px">
                    <p style="margin:0;color:#1a1a2e;font-size:18px;line-height:1.8">${message}</p>
                  </td>
                </tr>
                ${application.adminNote ? `
                <tr>
                  <td style="padding:20px;background:#fff3cd;border-radius:12px;border-right:4px solid #f59e0b">
                    <p style="margin:0 0 8px;color:#b45309;font-size:14px;font-weight:600">ملاحظة الإدارة</p>
                    <p style="margin:0;color:#1a1a2e;font-size:16px;line-height:1.8">${application.adminNote}</p>
                  </td>
                </tr>` : ''}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 40px;background:#f8f9fc;text-align:center">
              <p style="margin:0;color:#666;font-size:14px">هذه رسالة آلية من IEEE ANU</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  });
}
