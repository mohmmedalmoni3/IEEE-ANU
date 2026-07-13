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
const cookieSameSite = cleanCookieSameSite(process.env.COOKIE_SAMESITE || "Lax");
const cookieSecure = isProduction || cookieSameSite === "None";
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const adminEmails = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

if (isProduction && (!process.env.AUTH_SECRET || authSecret.length < 32)) {
  throw new Error("AUTH_SECRET must be at least 32 characters in production.");
}

if (!process.env.AUTH_SECRET) {
  console.warn("AUTH_SECRET is not set. Set a strong secret before production.");
}

app.set("trust proxy", true);
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("X-Download-Options", "noopen");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  res.setHeader("Cache-Control", "no-store");
  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
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

function cleanCookieSameSite(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "none") return "None";
  if (normalized === "strict") return "Strict";
  return "Lax";
}

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

function sameOriginGuard(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (origin && allowedOrigins.includes(origin)) return next();

  if (!origin && referer) {
    try {
      if (allowedOrigins.includes(new URL(referer).origin)) return next();
    } catch {
      return res.status(403).json({ message: "تم رفض الطلب لأسباب أمنية" });
    }
  }

  if (!origin && !referer && !isProduction) return next();
  return res.status(403).json({ message: "تم رفض الطلب لأسباب أمنية" });
}

app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 300, keyPrefix: "api" }));
app.use("/api", sameOriginGuard);

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
  try {
    if (!token || !token.includes(".")) return null;
    const [encoded, signature] = token.split(".");
    const expected = crypto.createHmac("sha256", authSecret).update(encoded).digest("base64url");
    const signatureBuffer = Buffer.from(signature || "");
    const expectedBuffer = Buffer.from(expected);
    if (signatureBuffer.length !== expectedBuffer.length) return null;
    if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
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

  res.cookie("ieee_session", token, cookieOptions);

  const secure = cookieSecure ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `ieee_session=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=${cookieSameSite}; Priority=High${secure}`
  );

  return token;
}


function clearSessionCookie(res) {
  const secure = cookieSecure ? "; Secure" : "";
  res.setHeader("Set-Cookie", `ieee_session=; HttpOnly; Path=/; Max-Age=0; SameSite=${cookieSameSite}; Priority=High${secure}`);
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

function isStrongPassword(value) {
  return (
    typeof value === "string" &&
    value.length >= 10 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
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

function parseActivity(activity) {
  return {
    id: activity.id,
    adminId: activity.admin_id,
    adminName: activity.admin_name,
    action: activity.action,
    targetType: activity.target_type,
    targetId: activity.target_id,
    description: activity.description,
    metadata: JSON.parse(activity.metadata || "{}"),
    createdAt: activity.created_at
  };
}

function parseNotification(notification) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    targetType: notification.target_type,
    targetId: notification.target_id,
    isRead: Boolean(notification.is_read),
    createdAt: notification.created_at
  };
}

function normalizeIp(value) {
  return String(value || "")
    .replace(/^::ffff:/, "")
    .trim();
}

function getClientIp(req) {
  const forwardedFor = String(req.headers["x-forwarded-for"] || "")
    .split(",")
    .map((item) => normalizeIp(item))
    .filter(Boolean);
  const cloudflareIp = normalizeIp(req.headers["cf-connecting-ip"]);
  const realIp = normalizeIp(req.headers["x-real-ip"]);
  return cloudflareIp || realIp || forwardedFor[0] || normalizeIp(req.ip || req.socket?.remoteAddress);
}

function parseUserAgent(userAgent) {
  const ua = String(userAgent || "");
  const lower = ua.toLowerCase();
  const deviceType = /ipad|tablet/.test(lower)
    ? "tablet"
    : /mobile|iphone|android|ipod/.test(lower)
      ? "mobile"
      : "desktop";

  let browser = "Unknown";
  if (/edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/opr\//i.test(ua) || /opera/i.test(ua)) browser = "Opera";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  let operatingSystem = "Unknown";
  if (/windows nt/i.test(ua)) operatingSystem = "Windows";
  else if (/android/i.test(ua)) operatingSystem = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) operatingSystem = "iOS";
  else if (/mac os x/i.test(ua)) operatingSystem = "macOS";
  else if (/linux/i.test(ua)) operatingSystem = "Linux";

  return { deviceType, browser, operatingSystem };
}

function parseLoginEvent(event) {
  return {
    id: event.id,
    userId: event.user_id,
    userName: event.user_name,
    userEmail: event.user_email,
    eventType: event.event_type,
    ipAddress: event.ip_address,
    forwardedFor: event.forwarded_for,
    userAgent: event.user_agent,
    deviceType: event.device_type,
    browser: event.browser,
    operatingSystem: event.operating_system,
    platform: event.platform,
    language: event.language,
    createdAt: event.created_at
  };
}

function parseLiveWorkshop(workshop, includeUrl = false, includeHidden = false) {
  if (!workshop || (!includeHidden && !workshop.is_visible)) return null;
  return {
    id: workshop.id,
    title: workshop.title,
    description: workshop.description,
    speaker: workshop.speaker,
    startsAt: workshop.starts_at,
    isLive: Boolean(workshop.is_live),
    isVisible: Boolean(workshop.is_visible),
    updatedAt: workshop.updated_at,
    ...(includeUrl ? { meetUrl: workshop.meet_url } : {})
  };
}

async function recordLoginEvent(req, user, eventType = "login") {
  const userAgent = String(req.headers["user-agent"] || "");
  const { deviceType, browser, operatingSystem } = parseUserAgent(userAgent);
  const forwardedFor = String(req.headers["x-forwarded-for"] || "");
  await run(
    `INSERT INTO login_events
     (id, user_id, event_type, ip_address, forwarded_for, user_agent, device_type, browser, operating_system, platform, language)
     VALUES ($id, $userId, $eventType, $ipAddress, $forwardedFor, $userAgent, $deviceType, $browser, $operatingSystem, $platform, $language)`,
    {
      $id: crypto.randomUUID(),
      $userId: user?.id || null,
      $eventType: eventType,
      $ipAddress: getClientIp(req),
      $forwardedFor: forwardedFor || null,
      $userAgent: userAgent || null,
      $deviceType: deviceType,
      $browser: browser,
      $operatingSystem: operatingSystem,
      $platform: cleanText(req.headers["sec-ch-ua-platform"] || "", 80) || null,
      $language: cleanText(req.headers["accept-language"] || "", 200) || null
    }
  );
}

async function logAdminActivity({ adminId, action, targetType, targetId, description, metadata = {} }) {
  await run(
    `INSERT INTO admin_activity (id, admin_id, action, target_type, target_id, description, metadata)
     VALUES ($id, $adminId, $action, $targetType, $targetId, $description, $metadata)`,
    {
      $id: crypto.randomUUID(),
      $adminId: adminId || null,
      $action: action,
      $targetType: targetType,
      $targetId: targetId || null,
      $description: description,
      $metadata: JSON.stringify(metadata)
    }
  );
}

async function createAdminNotification({ type, title, message, targetType, targetId }) {
  await run(
    `INSERT INTO admin_notifications (id, type, title, message, target_type, target_id)
     VALUES ($id, $type, $title, $message, $targetType, $targetId)`,
    {
      $id: crypto.randomUUID(),
      $type: type,
      $title: title,
      $message: message,
      $targetType: targetType || null,
      $targetId: targetId || null
    }
  );
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "IEEE ANU API", database: databaseProvider });
});

app.get("/api/site", async (req, res, next) => {
  try {
    const stats = await getAll('SELECT id, label, value, sort_order AS "sortOrder" FROM stats ORDER BY sort_order ASC');
    const creators = await getAll('SELECT id, name, role, platform, followers, url, sort_order AS "sortOrder" FROM creators ORDER BY sort_order ASC');
    const videos = await getAll('SELECT id, title, speaker, youtube_id AS "youtubeId", views, sort_order AS "sortOrder" FROM videos ORDER BY sort_order ASC');
    const products = await getAll('SELECT id, name, price, status, sort_order AS "sortOrder" FROM products ORDER BY sort_order ASC');
    const liveWorkshop = await getOne("SELECT * FROM live_workshop WHERE is_visible = 1 ORDER BY updated_at DESC LIMIT 1");
    res.json({ stats, creators, videos, products, liveWorkshop: parseLiveWorkshop(liveWorkshop) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/live-workshop/join", requireAuth, async (req, res, next) => {
  try {
    const workshop = await getOne("SELECT * FROM live_workshop WHERE is_visible = 1 AND is_live = 1 ORDER BY updated_at DESC LIMIT 1");
    if (!workshop) return res.status(404).json({ message: "لا توجد ورشة مباشرة الآن" });
    res.json({ workshop: parseLiveWorkshop(workshop, true) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/overview", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const usersCount = (await getOne("SELECT COUNT(*) AS count FROM users"))?.count || 0;
    const applicationsCount = (await getOne("SELECT COUNT(*) AS count FROM applications"))?.count || 0;
    const unreadNotifications = (await getOne("SELECT COUNT(*) AS count FROM admin_notifications WHERE is_read = 0"))?.count || 0;
    const pendingApplications = (await getOne("SELECT COUNT(*) AS count FROM applications WHERE status = $status", { $status: "قيد المراجعة" }))?.count || 0;
    const recentUsers = await getAll('SELECT id, firstname, lastname, email, role, created_at AS "createdAt" FROM users ORDER BY created_at DESC LIMIT 5');
    const recentApplications = await getAll('SELECT id, full_name AS "fullName", university_email AS "universityEmail", status, created_at AS "createdAt" FROM applications ORDER BY created_at DESC LIMIT 5');
    res.json({ usersCount, applicationsCount, unreadNotifications, pendingApplications, recentUsers, recentApplications });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/activity", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const activity = await getAll(`
      SELECT
        admin_activity.*,
        users.firstname || ' ' || users.lastname AS admin_name
      FROM admin_activity
      LEFT JOIN users ON users.id = admin_activity.admin_id
      ORDER BY admin_activity.created_at DESC
      LIMIT 100
    `);
    res.json({ activity: activity.map(parseActivity) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/activity", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await run("DELETE FROM admin_activity");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/notifications", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const notifications = await getAll("SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 100");
    const unreadCount = (await getOne("SELECT COUNT(*) AS count FROM admin_notifications WHERE is_read = 0"))?.count || 0;
    res.json({ notifications: notifications.map(parseNotification), unreadCount });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/notifications/:id/read", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await run("UPDATE admin_notifications SET is_read = 1 WHERE id = $id", { $id: req.params.id });
    const notification = await getOne("SELECT * FROM admin_notifications WHERE id = $id", { $id: req.params.id });
    if (!notification) return res.status(404).json({ message: "التنبيه غير موجود" });
    res.json({ notification: parseNotification(notification) });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/notifications/read-all", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await run("UPDATE admin_notifications SET is_read = 1");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/login-events", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const events = await getAll(`
      SELECT
        login_events.*,
        users.firstname || ' ' || users.lastname AS user_name,
        users.email AS user_email
      FROM login_events
      LEFT JOIN users ON users.id = login_events.user_id
      ORDER BY login_events.created_at DESC
      LIMIT 200
    `);
    res.json({ events: events.map(parseLoginEvent) });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/login-events", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await run("DELETE FROM login_events");
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/content", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const stats = await getAll('SELECT id, label, value, sort_order AS "sortOrder" FROM stats ORDER BY sort_order ASC');
    const creators = await getAll('SELECT id, name, role, platform, followers, url, sort_order AS "sortOrder" FROM creators ORDER BY sort_order ASC');
    const videos = await getAll('SELECT id, title, speaker, youtube_id AS "youtubeId", views, sort_order AS "sortOrder" FROM videos ORDER BY sort_order ASC');
    const products = await getAll('SELECT id, name, price, status, sort_order AS "sortOrder" FROM products ORDER BY sort_order ASC');
    res.json({ stats, creators, videos, products });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/live-workshop", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const workshop = await getOne("SELECT * FROM live_workshop ORDER BY updated_at DESC LIMIT 1");
    res.json({ workshop: workshop ? parseLiveWorkshop(workshop, true, true) : null });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/live-workshop", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const existing = await getOne("SELECT id FROM live_workshop ORDER BY updated_at DESC LIMIT 1");
    const id = existing?.id || crypto.randomUUID();
    const title = cleanText(req.body.title, 180);
    const description = cleanText(req.body.description, 800);
    const meetUrl = cleanText(req.body.meetUrl, 500);
    const speaker = cleanText(req.body.speaker, 140);
    const startsAt = cleanText(req.body.startsAt, 80);
    const isLive = req.body.isLive ? 1 : 0;
    const isVisible = req.body.isVisible ? 1 : 0;

    if (!title || !meetUrl) {
      return res.status(400).json({ message: "عنوان الورشة ورابط Google Meet مطلوبان" });
    }

    if (!/^https:\/\/meet\.google\.com\//i.test(meetUrl)) {
      return res.status(400).json({ message: "يجب أن يكون الرابط من Google Meet" });
    }

    if (existing) {
      await run(
        `UPDATE live_workshop
         SET title = $title, description = $description, meet_url = $meetUrl, speaker = $speaker,
             starts_at = $startsAt, is_live = $isLive, is_visible = $isVisible, updated_at = CURRENT_TIMESTAMP
         WHERE id = $id`,
        { $id: id, $title: title, $description: description || null, $meetUrl: meetUrl, $speaker: speaker || null, $startsAt: startsAt || null, $isLive: isLive, $isVisible: isVisible }
      );
    } else {
      await run(
        `INSERT INTO live_workshop (id, title, description, meet_url, speaker, starts_at, is_live, is_visible)
         VALUES ($id, $title, $description, $meetUrl, $speaker, $startsAt, $isLive, $isVisible)`,
        { $id: id, $title: title, $description: description || null, $meetUrl: meetUrl, $speaker: speaker || null, $startsAt: startsAt || null, $isLive: isLive, $isVisible: isVisible }
      );
    }

    await logAdminActivity({
      adminId: req.user.id,
      action: "live_workshop.update",
      targetType: "live_workshop",
      targetId: id,
      description: `عدّل إعدادات الورشة المباشرة: ${title}`,
      metadata: { isLive: Boolean(isLive), isVisible: Boolean(isVisible) }
    });

    const workshop = await getOne("SELECT * FROM live_workshop WHERE id = $id", { $id: id });
    res.json({ workshop: parseLiveWorkshop(workshop, true, true) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/content/:type", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const type = cleanText(req.params.type, 30);
    const id = crypto.randomUUID();
    const sortOrder = Number(req.body.sortOrder || 0);

    if (type === "stats") {
      const label = cleanText(req.body.label, 120);
      const value = Number(req.body.value || 0);
      if (!label) return res.status(400).json({ message: "اكتب اسم الإحصائية" });
      await run("INSERT INTO stats (id, label, value, sort_order) VALUES ($id, $label, $value, $sortOrder)", { $id: id, $label: label, $value: value, $sortOrder: sortOrder });
    } else if (type === "creators") {
      const name = cleanText(req.body.name, 120);
      const role = cleanText(req.body.role, 160);
      const platform = cleanText(req.body.platform, 80);
      const followers = cleanText(req.body.followers, 60);
      const url = cleanText(req.body.url, 400);
      if (!name || !role || !platform || !url) return res.status(400).json({ message: "أكمل بيانات صانع المحتوى" });
      await run(
        "INSERT INTO creators (id, name, role, platform, followers, url, sort_order) VALUES ($id, $name, $role, $platform, $followers, $url, $sortOrder)",
        { $id: id, $name: name, $role: role, $platform: platform, $followers: followers || "0", $url: url, $sortOrder: sortOrder }
      );
    } else if (type === "videos") {
      const title = cleanText(req.body.title, 160);
      const speaker = cleanText(req.body.speaker, 120);
      const youtubeId = cleanText(req.body.youtubeId, 80);
      const views = cleanText(req.body.views, 80);
      if (!title || !speaker || !youtubeId) return res.status(400).json({ message: "أكمل بيانات الفيديو" });
      await run(
        "INSERT INTO videos (id, title, speaker, youtube_id, views, sort_order) VALUES ($id, $title, $speaker, $youtubeId, $views, $sortOrder)",
        { $id: id, $title: title, $speaker: speaker, $youtubeId: youtubeId, $views: views || "0", $sortOrder: sortOrder }
      );
    } else if (type === "products") {
      const name = cleanText(req.body.name, 120);
      const price = cleanText(req.body.price, 80);
      const status = cleanText(req.body.status, 120);
      if (!name || !price || !status) return res.status(400).json({ message: "أكمل بيانات المنتج" });
      await run(
        "INSERT INTO products (id, name, price, status, sort_order) VALUES ($id, $name, $price, $status, $sortOrder)",
        { $id: id, $name: name, $price: price, $status: status, $sortOrder: sortOrder }
      );
    } else {
      return res.status(400).json({ message: "نوع المحتوى غير صالح" });
    }

    await logAdminActivity({
      adminId: req.user.id,
      action: "content.create",
      targetType: type,
      targetId: id,
      description: `أضاف محتوى جديد في ${type}`
    });
    res.status(201).json({ ok: true, id });
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/content/:type/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const type = cleanText(req.params.type, 30);
    const id = cleanText(req.params.id, 100);
    const sortOrder = Number(req.body.sortOrder || 0);

    if (type === "stats") {
      await run("UPDATE stats SET label = $label, value = $value, sort_order = $sortOrder WHERE id = $id", {
        $id: id,
        $label: cleanText(req.body.label, 120),
        $value: Number(req.body.value || 0),
        $sortOrder: sortOrder
      });
    } else if (type === "creators") {
      await run("UPDATE creators SET name = $name, role = $role, platform = $platform, followers = $followers, url = $url, sort_order = $sortOrder WHERE id = $id", {
        $id: id,
        $name: cleanText(req.body.name, 120),
        $role: cleanText(req.body.role, 160),
        $platform: cleanText(req.body.platform, 80),
        $followers: cleanText(req.body.followers, 60),
        $url: cleanText(req.body.url, 400),
        $sortOrder: sortOrder
      });
    } else if (type === "videos") {
      await run("UPDATE videos SET title = $title, speaker = $speaker, youtube_id = $youtubeId, views = $views, sort_order = $sortOrder WHERE id = $id", {
        $id: id,
        $title: cleanText(req.body.title, 160),
        $speaker: cleanText(req.body.speaker, 120),
        $youtubeId: cleanText(req.body.youtubeId, 80),
        $views: cleanText(req.body.views, 80),
        $sortOrder: sortOrder
      });
    } else if (type === "products") {
      await run("UPDATE products SET name = $name, price = $price, status = $status, sort_order = $sortOrder WHERE id = $id", {
        $id: id,
        $name: cleanText(req.body.name, 120),
        $price: cleanText(req.body.price, 80),
        $status: cleanText(req.body.status, 120),
        $sortOrder: sortOrder
      });
    } else {
      return res.status(400).json({ message: "نوع المحتوى غير صالح" });
    }

    await logAdminActivity({
      adminId: req.user.id,
      action: "content.update",
      targetType: type,
      targetId: id,
      description: `عدّل محتوى في ${type}`
    });
    res.json({ ok: true, id });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/content/:type/:id", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const type = cleanText(req.params.type, 30);
    const id = cleanText(req.params.id, 100);
    const tables = { stats: "stats", creators: "creators", videos: "videos", products: "products" };
    const table = tables[type];
    if (!table) return res.status(400).json({ message: "نوع المحتوى غير صالح" });

    await run(`DELETE FROM ${table} WHERE id = $id`, { $id: id });
    await logAdminActivity({
      adminId: req.user.id,
      action: "content.delete",
      targetType: type,
      targetId: id,
      description: `حذف محتوى من ${type}`
    });
    res.json({ ok: true, id });
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

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message: "كلمة المرور يجب أن تكون 10 أحرف على الأقل وتحتوي على حرف كبير وحرف صغير ورقم ورمز"
      });
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
    await createAdminNotification({
      type: "new_user",
      title: "مستخدم جديد",
      message: `تم إنشاء حساب جديد باسم ${firstname} ${lastname}`,
      targetType: "user",
      targetId: id
    });
    await recordLoginEvent(req, user, "register");
    const token = setSessionCookie(res, user);
res.json({
  user: publicUser(user),
  token
});
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
    await recordLoginEvent(req, user, "login");
    const token = setSessionCookie(res, user);
res.status(201).json({
  user: publicUser(user),
  token
});
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
    await logAdminActivity({
      adminId: req.user.id,
      action: "user.role.update",
      targetType: "user",
      targetId: user.id,
      description: `غيّر صلاحية ${user.firstname} ${user.lastname} إلى ${role}`,
      metadata: { oldRole: user.role, newRole: role }
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
    await logAdminActivity({
      adminId: req.user.id,
      action: "user.delete",
      targetType: "user",
      targetId: user.id,
      description: `حذف حساب ${user.firstname} ${user.lastname}`,
      metadata: { email: user.email }
    });
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
    await logAdminActivity({
      adminId: req.user.id,
      action: "message.send",
      targetType: "admin_message",
      targetId: id,
      description: `أرسل رسالة: ${subject}`,
      metadata: { audience, recipientsCount: validRecipients.length, sentCount, failedCount }
    });
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
    await createAdminNotification({
      type: "new_application",
      title: "طلب انضمام جديد",
      message: `وصل طلب جديد من ${fullName}`,
      targetType: "application",
      targetId: id
    });
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
    await logAdminActivity({
      adminId: req.user.id,
      action: "application.status.update",
      targetType: "application",
      targetId: application.id,
      description: `غيّر حالة طلب ${application.full_name} إلى ${status}`,
      metadata: { status, adminNote }
    });
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
    await logAdminActivity({
      adminId: req.user.id,
      action: "application.delete",
      targetType: "application",
      targetId: req.params.id,
      description: "حذف طلب انضمام"
    });
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

