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
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8">
      <h2>طلب انضمام جديد إلى IEEE ANU</h2>
      <p><strong>الاسم:</strong> ${application.fullName}</p>
      <p><strong>البريد الجامعي:</strong> ${application.universityEmail}</p>
      <p><strong>العمر:</strong> ${application.age}</p>
      <p><strong>الدولة:</strong> ${application.country}</p>
      <p><strong>الخبرة:</strong> ${application.experience}</p>
      <p><strong>المهارات:</strong> ${skills}</p>
      <p><strong>سبب الانضمام:</strong><br />${application.whyJoin}</p>
    </div>`
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
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8">
      <h2>تحديث حالة طلبك</h2>
      <p>مرحبا ${application.fullName},</p>
      <p>${message}</p>
      ${application.adminNote ? `<p><strong>ملاحظة الإدارة:</strong><br />${application.adminNote}</p>` : ""}
    </div>`
  });
}
