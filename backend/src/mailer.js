import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpSecure = process.env.SMTP_SECURE === "true";
const fromEmail = process.env.MAIL_FROM || smtpUser || "IEEE ANU <no-reply@ieee-anu.local>";

export function hasSmtpConfig() {
  return Boolean(smtpHost && smtpUser && smtpPass);
}

function createTransporter() {
  if (!hasSmtpConfig()) return null;
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
}

const transporter = createTransporter();

export async function verifyMailTransport() {
  if (!transporter) {
    throw new Error("SMTP غير مضبوط. أضف SMTP_HOST و SMTP_USER و SMTP_PASS في backend/.env حتى تصل الرسائل إلى البريد فعليا.");
  }
  await transporter.verify();
}

export async function sendMail({ to, subject, text, html, requireDelivery = false }) {
  if (!to) return null;

  if (!transporter) {
    if (requireDelivery) {
      throw new Error("SMTP غير مضبوط، لذلك لا يمكن ضمان وصول الرسالة إلى البريد.");
    }
    console.log("[mail preview]", { to, subject, text });
    return null;
  }

  return transporter.sendMail({
    from: fromEmail,
    to,
    subject,
    text,
    html
  });
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
