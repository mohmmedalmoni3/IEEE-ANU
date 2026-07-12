import bcrypt from "bcryptjs";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import { databaseProvider, getAll, getOne, initDb, run } from "./db.js";
import { notifyAdminsNewApplication, notifyApplicantStatus, sendMail, verifyMailTransport } from "./mailer.js";

dotenv.config();
await initDb();

const app = express();
const port = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === "production";
const authSecret = process.env.AUTH_SECRET || "change-this-secret-before-production";
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const adminEmails = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

if (!process.env.AUTH_SECRET) {
  console.warn("AUTH_SECRET is not set. Set a strong secret before production.");
}

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
  credentials: true
}));
app.use(express.json({ limit: "32kb" }));

function rateLimit({ windowMs, max, keyPrefix }) {
  const hits = new Map();
  return (req, res, next) => {
    const key = `${keyPrefix}:${req.ip}`;
    const now = Date.now();
    const current = hits.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > current.resetAt) {
      current.count = 0;
      current.resetAt = now + windowMs;
    }

    current.count += 1;
    hits.set(key, current);

    if (current.count > max) {
      return res.status(429).json({ message: "طلبات كثيرة جدا، حاول لاحقا" });
    }

    next();
  };
}

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 12, keyPrefix: "auth" });
const applicationLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, keyPrefix: "applications" });
const allowedStatuses = ["قيد المراجعة", "مقبول", "مرفوض", "بحاجة لمقابلة", "إعادة المقابلة"];

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function signToken(payload) {
  const body = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60
  };
  const encoded = base64url(JSON.stringify(body));
  const signature = crypto.createHmac("sha256", authSecret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifyToken(token) {
  if (!token || !token.includes(".")) return null;
  const [encoded, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", authSecret).update(encoded).digest("base64url");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function getCookie(req, name) {
  const cookies = req.headers.cookie || "";
  const match = cookies
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function setSessionCookie(res, user) {
  const token = signToken({ sub: user.id, role: user.role });
  const secure = isProduction ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `ieee_session=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${secure}`
  );
}

function clearSessionCookie(res) {
  const secure = isProduction ? "; Secure" : "";
  res.setHeader("Set-Cookie", `ieee_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`);
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    firstname: user.firstname,
    lastname: user.lastname,
    username: user.username,
    email: user.email,
    discord: user.discord,
    role: user.role,
    joinDate: user.created_at
  };
}

async function applyConfiguredAdmin(user) {
  if (!user || user.role === "admin" || !adminEmails.includes(String(user.email).toLowerCase())) return user;
  await run("UPDATE users SET role = 'admin', updated_at = CURRENT_TIMESTAMP WHERE id = $id", { $id: user.id });
  return getOne("SELECT * FROM users WHERE id = $id", { $id: user.id });
}

async function requireAuth(req, res, next) {
  try {
    const payload = verifyToken(getCookie(req, "ieee_session"));
    if (!payload) return res.status(401).json({ message: "يجب تسجيل الدخول أولا" });
    const user = await applyConfiguredAdmin(await getOne("SELECT * FROM users WHERE id = $id", { $id: payload.sub }));
    if (!user) return res.status(401).json({ message: "الجلسة غير صالحة" });
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "هذه الصفحة مخصصة للإدارة فقط" });
  }
  next();
}

function cleanText(value, maxLength = 240) {
  return String(value || "").trim().slice(0, maxLength);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseApplication(application) {
  return {
    id: application.id,
    userId: application.user_id,
    fullName: application.full_name,
    universityEmail: application.university_email,
    age: application.age,
    country: application.country,
    hours: application.hours,
    experience: application.experience,
    whyJoin: application.why_join,
    skills: JSON.parse(application.skills || "[]"),
    referral: application.referral,
    adminNote: application.admin_note,
    status: application.status,
    createdAt: application.created_at,
    updatedAt: application.updated_at
  };
}

function parseAdminMessage(message) {
  return {
    id: message.id,
    senderId: message.sender_id,
    subject: message.subject,
    message: message.message,
    note: message.note,
    priority: message.priority,
    audience: message.audience,
    recipientsCount: message.recipients_count,
    sentCount: message.sent_count,
    failedCount: message.failed_count,
    supportEmail: message.support_email,
    supportUrl: message.support_url,
    createdAt: message.created_at
  };
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "IEEE ANU API", database: databaseProvider });
});

app.get("/api/site", async (req, res, next) => {
  try {
    const stats = await getAll("SELECT label, value FROM stats ORDER BY sort_order ASC");
    const creators = await getAll("SELECT name, role, platform, followers, url FROM creators ORDER BY sort_order ASC");
    const videos = await getAll('SELECT title, speaker, youtube_id AS "youtubeId", views FROM videos ORDER BY sort_order ASC');
    const products = await getAll("SELECT name, price, status FROM products ORDER BY sort_order ASC");
    res.json({ stats, creators, videos, products });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/register", authLimiter, async (req, res, next) => {
  try {
    const firstname = cleanText(req.body.firstname, 80);
    const lastname = cleanText(req.body.lastname, 80);
    const username = cleanText(req.body.username, 40);
    const email = cleanText(req.body.email, 160).toLowerCase();
    const password = String(req.body.password || "");
    const discord = cleanText(req.body.discord, 80);

    if (!firstname || !lastname || !username || !email || !password) {
      return res.status(400).json({ message: "الرجاء تعبئة جميع الحقول المطلوبة" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "البريد الإلكتروني غير صالح" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });
    }

    const exists = await getOne("SELECT id FROM users WHERE email = $email OR username = $username", {
      $email: email,
      $username: username
    });

    if (exists) return res.status(409).json({ message: "الحساب موجود مسبقا" });

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    const usersCount = (await getOne("SELECT COUNT(*) AS count FROM users"))?.count || 0;
    const role = usersCount === 0 || adminEmails.includes(email) ? "admin" : "member";

    await run(
      `INSERT INTO users (id, firstname, lastname, username, email, discord, password_hash, role)
       VALUES ($id, $firstname, $lastname, $username, $email, $discord, $passwordHash, $role)`,
      {
        $id: id,
        $firstname: firstname,
        $lastname: lastname,
        $username: username,
        $email: email,
        $discord: discord || null,
        $passwordHash: passwordHash,
        $role: role
      }
    );

    const user = await getOne("SELECT * FROM users WHERE id = $id", { $id: id });
    setSessionCookie(res, user);
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", authLimiter, async (req, res, next) => {
  try {
    const email = cleanText(req.body.email, 160).toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) return res.status(400).json({ message: "الرجاء إدخال البريد وكلمة المرور" });

    let user = await getOne("SELECT * FROM users WHERE email = $email OR username = $email", { $email: email });
    const validPassword = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!user || !validPassword) return res.status(401).json({ message: "البريد أو كلمة المرور غير صحيحة" });

    user = await applyConfiguredAdmin(user);
    setSessionCookie(res, user);
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.post("/api/auth/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

app.get("/api/users", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const users = await getAll(`
      SELECT
        users.id,
        users.firstname,
        users.lastname,
        users.username,
        users.email,
        users.discord,
        users.role,
        users.created_at AS "createdAt",
        users.updated_at AS "updatedAt",
        COUNT(applications.id) AS "applicationsCount"
      FROM users
      LEFT JOIN applications ON applications.user_id = users.id
      GROUP BY users.id
      ORDER BY users.created_at DESC
    `);

    res.json({ users });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/users/:id/role", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const role = cleanText(req.body.role, 20);
    if (!["member", "admin"].includes(role)) {
      return res.status(400).json({ message: "صلاحية المستخدم غير صالحة" });
    }

    const user = await getOne("SELECT * FROM users WHERE id = $id", { $id: req.params.id });
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

    if (user.id === req.user.id && role !== "admin") {
      return res.status(400).json({ message: "لا يمكنك إزالة صلاحية المدير من حسابك الحالي" });
    }

    const adminsCount = (await getOne("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'"))?.count || 0;
    if (user.role === "admin" && role !== "admin" && adminsCount <= 1) {
      return res.status(400).json({ message: "لا يمكن إزالة آخر حساب مدير" });
    }

    await run("UPDATE users SET role = $role, updated_at = CURRENT_TIMESTAMP WHERE id = $id", {
      $id: req.params.id,
      $role: role
    });

    const updatedUser = await getOne(
      `SELECT
        users.id,
        users.firstname,
        users.lastname,
        users.username,
        users.email,
        users.discord,
        users.role,
        users.created_at AS "createdAt",
        users.updated_at AS "updatedAt",
        COUNT(applications.id) AS "applicationsCount"
      FROM users
      LEFT JOIN applications ON applications.user_id = users.id
      WHERE users.id = $id
      GROUP BY users.id`,
      { $id: req.params.id }
    );

    res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/users/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const user = await getOne("SELECT * FROM users WHERE id = $id", { $id: req.params.id });
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

    if (user.id === req.user.id) {
      return res.status(400).json({ message: "لا يمكنك حذف حسابك الحالي" });
    }

    const adminsCount = (await getOne("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'"))?.count || 0;
    if (user.role === "admin" && adminsCount <= 1) {
      return res.status(400).json({ message: "لا يمكن حذف آخر حساب مدير" });
    }

    await run("UPDATE applications SET user_id = NULL WHERE user_id = $id", { $id: req.params.id });
    await run("DELETE FROM users WHERE id = $id", { $id: req.params.id });
    res.json({ ok: true, id: req.params.id });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/messages", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const messages = await getAll("SELECT * FROM admin_messages ORDER BY created_at DESC LIMIT 50");
    res.json({ messages: messages.map(parseAdminMessage) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/messages", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const subject = cleanText(req.body.subject, 160);
    const message = cleanText(req.body.message, 4000);
    const note = cleanText(req.body.note, 1200);
    const priority = cleanText(req.body.priority || "normal", 20);
    const audience = cleanText(req.body.audience || "selected", 20);
    const userIds = Array.isArray(req.body.userIds) ? req.body.userIds.map((id) => cleanText(id, 80)).filter(Boolean) : [];
    const supportEmail = cleanText(req.body.supportEmail || process.env.SUPPORT_EMAIL || process.env.MAIL_FROM || "", 160);
    const supportUrl = cleanText(req.body.supportUrl || process.env.SUPPORT_URL || "", 300);

    if (!subject || !message) {
      return res.status(400).json({ message: "الرجاء كتابة عنوان الرسالة ومحتواها" });
    }

    if (!["normal", "important", "urgent"].includes(priority)) {
      return res.status(400).json({ message: "درجة التنبيه غير صالحة" });
    }

    if (!["all", "admins", "members", "selected"].includes(audience)) {
      return res.status(400).json({ message: "نوع الجمهور غير صالح" });
    }

    try {
      await verifyMailTransport();
    } catch (error) {
      return res.status(503).json({ message: error.message });
    }

    let recipients = [];
    if (audience === "all") {
      recipients = await getAll("SELECT id, firstname, lastname, email, role FROM users ORDER BY created_at DESC");
    } else if (audience === "admins") {
      recipients = await getAll("SELECT id, firstname, lastname, email, role FROM users WHERE role = 'admin' ORDER BY created_at DESC");
    } else if (audience === "members") {
      recipients = await getAll("SELECT id, firstname, lastname, email, role FROM users WHERE role != 'admin' ORDER BY created_at DESC");
    } else {
      if (!userIds.length) {
        return res.status(400).json({ message: "اختر مستخدما واحدا على الأقل" });
      }
      const placeholders = userIds.map((_, index) => `$id${index}`).join(", ");
      const params = Object.fromEntries(userIds.map((id, index) => [`$id${index}`, id]));
      recipients = await getAll(`SELECT id, firstname, lastname, email, role FROM users WHERE id IN (${placeholders})`, params);
    }

    const validRecipients = recipients.filter((user) => isValidEmail(user.email));
    if (!validRecipients.length) {
      return res.status(400).json({ message: "لا يوجد مستلمون لديهم بريد صالح" });
    }

    const priorityLabel = priority === "urgent" ? "عاجل" : priority === "important" ? "مهم" : "تنبيه";
    let sentCount = 0;
    let failedCount = 0;
    const failed = [];

    for (const recipient of validRecipients) {
      const recipientName = `${recipient.firstname || ""} ${recipient.lastname || ""}`.trim() || recipient.email;
      const textParts = [
        `مرحبا ${recipientName},`,
        "",
        `[${priorityLabel}] ${subject}`,
        "",
        message
      ];

      if (note) textParts.push("", `ملاحظة: ${note}`);
      if (supportEmail || supportUrl) {
        textParts.push("", "للتواصل الفوري مع الدعم:");
        if (supportEmail) textParts.push(`البريد: ${supportEmail}`);
        if (supportUrl) textParts.push(`الرابط: ${supportUrl}`);
      }

      const supportHtml = supportEmail || supportUrl
        ? `<div style="margin-top:18px;padding:14px;border:1px solid #d9e7ff;border-radius:8px;background:#f6fbff">
            <strong>التواصل الفوري مع الدعم</strong>
            ${supportEmail ? `<p>البريد: <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a></p>` : ""}
            ${supportUrl ? `<p>الرابط: <a href="${escapeHtml(supportUrl)}">${escapeHtml(supportUrl)}</a></p>` : ""}
          </div>`
        : "";

      try {
        await sendMail({
          to: recipient.email,
          subject: `[${priorityLabel}] ${subject}`,
          text: textParts.join("\n"),
          requireDelivery: true,
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8;color:#111">
            <h2>${escapeHtml(subject)}</h2>
            <p>مرحبا ${escapeHtml(recipientName)},</p>
            <div style="white-space:pre-wrap">${escapeHtml(message)}</div>
            ${note ? `<p><strong>ملاحظة:</strong> ${escapeHtml(note)}</p>` : ""}
            ${supportHtml}
          </div>`
        });
        sentCount += 1;
      } catch (error) {
        failedCount += 1;
        failed.push({ email: recipient.email, error: error.message });
      }
    }

    const id = crypto.randomUUID();
    await run(
      `INSERT INTO admin_messages
       (id, sender_id, subject, message, note, priority, audience, recipients_count, sent_count, failed_count, support_email, support_url)
       VALUES ($id, $senderId, $subject, $message, $note, $priority, $audience, $recipientsCount, $sentCount, $failedCount, $supportEmail, $supportUrl)`,
      {
        $id: id,
        $senderId: req.user.id,
        $subject: subject,
        $message: message,
        $note: note || null,
        $priority: priority,
        $audience: audience,
        $recipientsCount: validRecipients.length,
        $sentCount: sentCount,
        $failedCount: failedCount,
        $supportEmail: supportEmail || null,
        $supportUrl: supportUrl || null
      }
    );

    const savedMessage = await getOne("SELECT * FROM admin_messages WHERE id = $id", { $id: id });
    res.status(failedCount ? 207 : 201).json({
      message: failedCount ? "تم إرسال بعض الرسائل وفشل بعضها" : "تم إرسال الرسالة إلى البريد بنجاح",
      result: parseAdminMessage(savedMessage),
      failed
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/applications", applicationLimiter, requireAuth, async (req, res, next) => {
  try {
    const fullName = cleanText(req.body.fullName, 140);
    const universityEmail = cleanText(req.body.universityEmail, 160).toLowerCase();
    const age = Number(req.body.age);
    const country = cleanText(req.body.country, 80);
    const hours = cleanText(req.body.hours, 80);
    const experience = cleanText(req.body.experience, 80);
    const whyJoin = cleanText(req.body.whyJoin, 1500);
    const skills = Array.isArray(req.body.skills)
      ? req.body.skills.map((skill) => cleanText(skill, 80)).filter(Boolean)
      : [];
    const referral = cleanText(req.body.referral, 120);

    if (!fullName || !universityEmail || !age || !country || !experience || !whyJoin) {
      return res.status(400).json({ message: "الرجاء تعبئة الحقول الأساسية" });
    }

    if (!isValidEmail(universityEmail) || age < 16 || age > 100) {
      return res.status(400).json({ message: "يرجى التأكد من البريد والعمر" });
    }

    const duplicateApplication = await getOne(
      `SELECT id, status FROM applications
       WHERE user_id = $userId OR lower(university_email) = lower($universityEmail)
       ORDER BY created_at DESC
       LIMIT 1`,
      { $userId: req.user?.id || "__guest__", $universityEmail: universityEmail }
    );

    if (duplicateApplication) {
      return res.status(409).json({
        message: "لديك طلب سابق بالفعل. يمكنك متابعة حالته من الملف الشخصي بدل إرسال طلب جديد.",
        application: { id: duplicateApplication.id, status: duplicateApplication.status }
      });
    }

    const id = crypto.randomUUID();
    await run(
      `INSERT INTO applications
       (id, user_id, full_name, university_email, age, country, hours, experience, why_join, skills, referral)
       VALUES ($id, $userId, $fullName, $universityEmail, $age, $country, $hours, $experience, $whyJoin, $skills, $referral)`,
      {
        $id: id,
        $userId: req.user?.id || null,
        $fullName: fullName,
        $universityEmail: universityEmail,
        $age: age,
        $country: country,
        $hours: hours || null,
        $experience: experience,
        $whyJoin: whyJoin,
        $skills: JSON.stringify(skills),
        $referral: referral || null
      }
    );

    const application = await getOne("SELECT * FROM applications WHERE id = $id", { $id: id });
    const parsedApplication = parseApplication(application);
    notifyAdminsNewApplication(parsedApplication, adminEmails).catch((error) => {
      console.error("Failed to send admin notification:", error);
    });
    res.status(201).json({ application: parsedApplication });
  } catch (error) {
    next(error);
  }
});

app.get("/api/applications/me", requireAuth, async (req, res, next) => {
  try {
    const applications = await getAll(
      `SELECT * FROM applications
       WHERE user_id = $userId OR lower(university_email) = lower($email)
       ORDER BY created_at DESC`,
      { $userId: req.user.id, $email: req.user.email }
    );
    res.json({ applications: applications.map(parseApplication) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/applications", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const applications = await getAll("SELECT * FROM applications ORDER BY created_at DESC");
    res.json({ applications: applications.map(parseApplication) });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/applications/:id/status", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const status = cleanText(req.body.status, 80);
    const adminNote = cleanText(req.body.adminNote, 1500);
    if (!allowedStatuses.includes(status)) return res.status(400).json({ message: "حالة الطلب غير صالحة" });

    await run(
      "UPDATE applications SET status = $status, admin_note = $adminNote, updated_at = CURRENT_TIMESTAMP WHERE id = $id",
      { $id: req.params.id, $status: status, $adminNote: adminNote || null }
    );

    const application = await getOne("SELECT * FROM applications WHERE id = $id", { $id: req.params.id });
    if (!application) return res.status(404).json({ message: "الطلب غير موجود" });

    const parsedApplication = parseApplication(application);
    notifyApplicantStatus(parsedApplication).catch((error) => {
      console.error("Failed to send applicant notification:", error);
    });
    res.json({ application: parsedApplication });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/applications/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const application = await getOne("SELECT id FROM applications WHERE id = $id", { $id: req.params.id });
    if (!application) return res.status(404).json({ message: "الطلب غير موجود" });

    await run("DELETE FROM applications WHERE id = $id", { $id: req.params.id });
    res.json({ ok: true, id: req.params.id });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ message: "المسار غير موجود" });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: "حدث خطأ في الخادم" });
});

app.listen(port, () => {
  console.log(`IEEE ANU API running on http://localhost:${port}`);
});

