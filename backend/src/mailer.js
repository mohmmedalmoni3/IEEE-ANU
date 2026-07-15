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
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>طلب انضمام جديد</title>
<!--[if !mso]><!-->
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<!--<![endif]-->
<style>
  body, table, td, a, p, div, span { font-family: 'Cairo', 'Tahoma', 'Segoe UI', Arial, sans-serif !important; }
</style>
</head>
<body style="margin:0; padding:0; background-color:#f0f2f6; font-family: 'Cairo', 'Tahoma', 'Segoe UI', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f6; padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 40px rgba(0,20,50,0.10);">

          <!-- Top accent bar -->
          <tr>
            <td style="background:linear-gradient(90deg, #00629B 0%, #0088CC 50%, #00629B 100%); height:6px; line-height:6px; font-size:0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(160deg, #003a5d 0%, #00629B 100%); padding:48px 30px 42px; text-align:center;">

              <!-- Monogram badge -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 22px;">
                <tr>
                  <td style="width:66px; height:66px; background-color:rgba(255,255,255,0.12); border:2px solid rgba(255,255,255,0.35); border-radius:50%; text-align:center; vertical-align:middle; font-size:24px; font-weight:bold; color:#ffffff; letter-spacing:1px;">
                    IEEE
                  </td>
                </tr>
              </table>

              <div style="font-size:13px; letter-spacing:3px; color:#8fd1ff; text-transform:uppercase; margin-bottom:10px; font-weight:bold;">
                Ajloun National University
              </div>

              <div style="font-size:29px; color:#ffffff; font-weight:800; line-height:1.4;">
                طلب انضمام جديد
              </div>

              <div style="font-size:15px; color:#c9e6fb; margin-top:10px;">
                ${application.fullName}
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:44px 40px 20px; text-align:right; color:#232833; font-size:16px; line-height:2;">
              <p style="margin:0 0 22px;">
                وصل طلب انضمام جديد إلى IEEE ANU. إليك تفاصيل المتقدم:
              </p>
            </td>
          </tr>

          <!-- Details list -->
          <tr>
            <td style="padding:4px 40px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px 0; text-align:right; border-bottom:1px solid #eef1f6;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="width:40px; vertical-align:top;">
                          <div style="width:28px; height:28px; background-color:#e8f3fc; border-radius:8px; text-align:center; line-height:28px; color:#00629B; font-weight:bold;">✓</div>
                        </td>
                        <td style="color:#3a4150; font-size:15px; padding-right:8px;"><strong>الاسم:</strong> ${application.fullName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; text-align:right; border-bottom:1px solid #eef1f6;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="width:40px; vertical-align:top;">
                          <div style="width:28px; height:28px; background-color:#e8f3fc; border-radius:8px; text-align:center; line-height:28px; color:#00629B; font-weight:bold;">✓</div>
                        </td>
                        <td style="color:#3a4150; font-size:15px; padding-right:8px;"><strong>البريد الجامعي:</strong> ${application.universityEmail}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; text-align:right; border-bottom:1px solid #eef1f6;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="width:40px; vertical-align:top;">
                          <div style="width:28px; height:28px; background-color:#e8f3fc; border-radius:8px; text-align:center; line-height:28px; color:#00629B; font-weight:bold;">✓</div>
                        </td>
                        <td style="color:#3a4150; font-size:15px; padding-right:8px;"><strong>العمر:</strong> ${application.age} | <strong>الدولة:</strong> ${application.country}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; text-align:right; border-bottom:1px solid #eef1f6;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="width:40px; vertical-align:top;">
                          <div style="width:28px; height:28px; background-color:#e8f3fc; border-radius:8px; text-align:center; line-height:28px; color:#00629B; font-weight:bold;">✓</div>
                        </td>
                        <td style="color:#3a4150; font-size:15px; padding-right:8px;"><strong>الخبرة:</strong> ${application.experience}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; text-align:right; border-bottom:1px solid #eef1f6;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="width:40px; vertical-align:top;">
                          <div style="width:28px; height:28px; background-color:#e8f3fc; border-radius:8px; text-align:center; line-height:28px; color:#00629B; font-weight:bold;">✓</div>
                        </td>
                        <td style="color:#3a4150; font-size:15px; padding-right:8px;"><strong>المهارات:</strong> ${skills}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="width:40px; vertical-align:top;">
                          <div style="width:28px; height:28px; background-color:#e8f3fc; border-radius:8px; text-align:center; line-height:28px; color:#00629B; font-weight:bold;">✓</div>
                        </td>
                        <td style="color:#3a4150; font-size:15px; padding-right:8px;"><strong>سبب الانضمام:</strong> ${application.whyJoin}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 40px 36px; text-align:right;">
              <hr style="border:none; border-top:1px solid #eef1f6; margin:0 0 24px;">
              <p style="margin:0; font-size:15px; color:#6b7280;">مع خالص التقدير،</p>
              <p style="margin:4px 0 0; font-weight:bold; color:#00629B; font-size:16px;">فريق IEEE ANU</p>
            </td>
          </tr>

          <!-- Footer - Social links -->
          <tr>
            <td style="background-color:#f7f9fc; padding:28px 40px; text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 18px;">
                <tr>
                  <td style="padding:0 8px;">
                    <a href="https://instagram.com/ieeeanu" target="_blank" style="text-decoration:none; display:inline-block; width:38px; height:38px; background-color:#ffffff; border:1px solid #e2e6ee; border-radius:50%; text-align:center; line-height:38px; color:#00629B; font-size:15px; font-weight:bold;">IG</a>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="https://linkedin.com/company/ieeeanu" target="_blank" style="text-decoration:none; display:inline-block; width:38px; height:38px; background-color:#ffffff; border:1px solid #e2e6ee; border-radius:50%; text-align:center; line-height:38px; color:#00629B; font-size:15px; font-weight:bold;">in</a>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="https://facebook.com/ieeeanu" target="_blank" style="text-decoration:none; display:inline-block; width:38px; height:38px; background-color:#ffffff; border:1px solid #e2e6ee; border-radius:50%; text-align:center; line-height:38px; color:#00629B; font-size:15px; font-weight:bold;">FB</a>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="https://twitter.com/ieeeanu" target="_blank" style="text-decoration:none; display:inline-block; width:38px; height:38px; background-color:#ffffff; border:1px solid #e2e6ee; border-radius:50%; text-align:center; line-height:38px; color:#00629B; font-size:15px; font-weight:bold;">X</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px; font-size:13px; color:#6b7280;">
                📧 ieeeanusupport@gmail.com &nbsp;|&nbsp; 🌐 ieeeanu.app
              </p>
              <p style="margin:0; font-size:12px; color:#9aa1ac;">
                © 2026 IEEE ANU Student Branch. جميع الحقوق محفوظة.
              </p>
            </td>
          </tr>

        </table>

        <!-- Note outside card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="margin-top:20px;">
          <tr>
            <td style="text-align:center; font-size:12px; color:#a3a9b5; line-height:1.8;">
              وصلتك هذه الرسالة لأنك مسؤول في IEEE ANU
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

  await sendMail({
    to: application.universityEmail,
    subject: "تحديث حالة طلبك - IEEE ANU",
    text: [`مرحبا ${application.fullName},`, "", message, note].join("\n"),
    html: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>تحديث حالة طلبك</title>
<!--[if !mso]><!-->
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<!--<![endif]-->
<style>
  body, table, td, a, p, div, span { font-family: 'Cairo', 'Tahoma', 'Segoe UI', Arial, sans-serif !important; }
</style>
</head>
<body style="margin:0; padding:0; background-color:#f0f2f6; font-family: 'Cairo', 'Tahoma', 'Segoe UI', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f6; padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 40px rgba(0,20,50,0.10);">

          <!-- Top accent bar -->
          <tr>
            <td style="background:linear-gradient(90deg, #00629B 0%, #0088CC 50%, #00629B 100%); height:6px; line-height:6px; font-size:0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(160deg, #003a5d 0%, #00629B 100%); padding:48px 30px 42px; text-align:center;">

              <!-- Monogram badge -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 22px;">
                <tr>
                  <td style="width:66px; height:66px; background-color:rgba(255,255,255,0.12); border:2px solid rgba(255,255,255,0.35); border-radius:50%; text-align:center; vertical-align:middle; font-size:24px; font-weight:bold; color:#ffffff; letter-spacing:1px;">
                    IEEE
                  </td>
                </tr>
              </table>

              <div style="font-size:13px; letter-spacing:3px; color:#8fd1ff; text-transform:uppercase; margin-bottom:10px; font-weight:bold;">
                Ajloun National University
              </div>

              <div style="font-size:29px; color:#ffffff; font-weight:800; line-height:1.4;">
                تحديث حالة طلبك
              </div>

              <div style="font-size:15px; color:#c9e6fb; margin-top:10px;">
                ${application.fullName}
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:44px 40px 20px; text-align:right; color:#232833; font-size:16px; line-height:2;">
              <p style="margin:0 0 22px;">
                مرحبا ${application.fullName}،
              </p>
              <p style="margin:0 0 22px;">
                ${message}
              </p>
            </td>
          </tr>

          <!-- Status badge -->
          <tr>
            <td style="padding:4px 40px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px; background-color:#e8f3fc; border-radius:12px; text-align:center; border:2px solid #00629B;">
                    <div style="font-size:22px; color:#00629B; font-weight:bold;">
                      الحالة: ${application.status}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${application.adminNote ? `
          <!-- Admin note -->
          <tr>
            <td style="padding:4px 40px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:20px; background-color:#fff9e6; border-radius:12px; border-right:4px solid #f59e0b;">
                    <p style="margin:0 0 8px; color:#b45309; font-size:14px; font-weight:bold;">ملاحظة الإدارة</p>
                    <p style="margin:0; color:#1a1a2e; font-size:15px; line-height:1.8;">${application.adminNote}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ''}

          <!-- Footer -->
          <tr>
            <td style="padding:0 40px 36px; text-align:right;">
              <hr style="border:none; border-top:1px solid #eef1f6; margin:0 0 24px;">
              <p style="margin:0; font-size:15px; color:#6b7280;">مع خالص التقدير،</p>
              <p style="margin:4px 0 0; font-weight:bold; color:#00629B; font-size:16px;">فريق IEEE ANU</p>
            </td>
          </tr>

          <!-- Footer - Social links -->
          <tr>
            <td style="background-color:#f7f9fc; padding:28px 40px; text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 18px;">
                <tr>
                  <td style="padding:0 8px;">
                    <a href="https://instagram.com/ieeeanu" target="_blank" style="text-decoration:none; display:inline-block; width:38px; height:38px; background-color:#ffffff; border:1px solid #e2e6ee; border-radius:50%; text-align:center; line-height:38px; color:#00629B; font-size:15px; font-weight:bold;">IG</a>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="https://linkedin.com/company/ieeeanu" target="_blank" style="text-decoration:none; display:inline-block; width:38px; height:38px; background-color:#ffffff; border:1px solid #e2e6ee; border-radius:50%; text-align:center; line-height:38px; color:#00629B; font-size:15px; font-weight:bold;">in</a>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="https://facebook.com/ieeeanu" target="_blank" style="text-decoration:none; display:inline-block; width:38px; height:38px; background-color:#ffffff; border:1px solid #e2e6ee; border-radius:50%; text-align:center; line-height:38px; color:#00629B; font-size:15px; font-weight:bold;">FB</a>
                  </td>
                  <td style="padding:0 8px;">
                    <a href="https://twitter.com/ieeeanu" target="_blank" style="text-decoration:none; display:inline-block; width:38px; height:38px; background-color:#ffffff; border:1px solid #e2e6ee; border-radius:50%; text-align:center; line-height:38px; color:#00629B; font-size:15px; font-weight:bold;">X</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px; font-size:13px; color:#6b7280;">
                📧 ieeeanusupport@gmail.com &nbsp;|&nbsp; 🌐 ieeeanu.app
              </p>
              <p style="margin:0; font-size:12px; color:#9aa1ac;">
                © 2026 IEEE ANU Student Branch. جميع الحقوق محفوظة.
              </p>
            </td>
          </tr>

        </table>

        <!-- Note outside card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="margin-top:20px;">
          <tr>
            <td style="text-align:center; font-size:12px; color:#a3a9b5; line-height:1.8;">
              وصلتك هذه الرسالة لأنك قدمت طلب انضمام إلى IEEE ANU
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
