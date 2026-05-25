"use client";

import { apiDelete, apiGet } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const deviceLabels = {
  all: "كل الأجهزة",
  mobile: "هاتف",
  tablet: "تابلت",
  desktop: "كمبيوتر"
};

const eventLabels = {
  all: "كل العمليات",
  login: "تسجيل دخول",
  register: "إنشاء حساب"
};

function safeCsv(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ").trim();
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

function isLocalIp(ip) {
  return !ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.");
}

export default function LoginsAdminClient() {
  const [events, setEvents] = useState([]);
  const [query, setQuery] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  function loadEvents() {
    setLoading(true);
    setMessage("");
    apiGet("/admin/login-events")
      .then((data) => setEvents(data.events || []))
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return events.filter((event) => {
      const matchesDevice = deviceFilter === "all" || event.deviceType === deviceFilter;
      const matchesEvent = eventFilter === "all" || event.eventType === eventFilter;
      const searchable = [
        event.userName,
        event.userEmail,
        event.ipAddress,
        event.forwardedFor,
        event.deviceType,
        event.browser,
        event.operatingSystem,
        event.platform,
        event.language,
        event.userAgent
      ].join(" ").toLowerCase();

      return matchesDevice && matchesEvent && (!normalized || searchable.includes(normalized));
    });
  }, [deviceFilter, eventFilter, events, query]);

  const summary = useMemo(() => {
    const uniqueIps = new Set(events.map((event) => event.ipAddress).filter(Boolean));
    return {
      total: events.length,
      mobile: events.filter((event) => event.deviceType === "mobile").length,
      desktop: events.filter((event) => event.deviceType === "desktop").length,
      register: events.filter((event) => event.eventType === "register").length,
      uniqueIps: uniqueIps.size
    };
  }, [events]);

  function exportCsv() {
    const headers = ["المستخدم", "البريد", "العملية", "IP", "الجهاز", "المتصفح", "النظام", "المنصة", "اللغة", "الوقت", "User Agent"];
    const rows = filteredEvents.map((event) => [
      event.userName,
      event.userEmail,
      eventLabels[event.eventType] || event.eventType,
      event.ipAddress,
      deviceLabels[event.deviceType] || event.deviceType,
      event.browser,
      event.operatingSystem,
      event.platform,
      event.language,
      event.createdAt,
      event.userAgent
    ]);
    const csv = [headers, ...rows].map((row) => row.map(safeCsv).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ieee-anu-login-events-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function deleteAllEvents() {
    const ok = window.confirm("هل أنت متأكد من حذف كل سجلات الدخول؟ لا يمكن التراجع عن هذه العملية.");
    if (!ok) return;

    try {
      await apiDelete("/admin/login-events");
      setEvents([]);
      setMessage("تم حذف كل سجلات الدخول بنجاح.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (loading) {
    return <section className="page-content"><div className="info-card center">جاري تحميل سجلات الدخول...</div></section>;
  }

  if (message && !events.length) {
    return (
      <section className="page-content narrow">
        <div className="info-card center">
          <h3>{message}</h3>
          <Link className="apply-btn" href="/login">تسجيل الدخول</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page-content">
      <div className="admin-summary">
        <span className="admin-metric total">كل السجلات <strong>{summary.total}</strong></span>
        <span className="admin-metric accepted">IP مختلف <strong>{summary.uniqueIps}</strong></span>
        <span className="admin-metric visible">كمبيوتر <strong>{summary.desktop}</strong></span>
        <span className="admin-metric pending">هاتف <strong>{summary.mobile}</strong></span>
        <span className="admin-metric interview">إنشاء حساب <strong>{summary.register}</strong></span>
      </div>

      <div className="admin-toolbar login-toolbar">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="بحث بالاسم، الإيميل، IP، الجهاز، المتصفح..."
          aria-label="بحث في سجلات الدخول"
        />
        <select value={deviceFilter} onChange={(event) => setDeviceFilter(event.target.value)} aria-label="فلترة حسب الجهاز">
          {Object.entries(deviceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={eventFilter} onChange={(event) => setEventFilter(event.target.value)} aria-label="فلترة حسب العملية">
          {Object.entries(eventLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button className="btn btn-secondary" type="button" onClick={loadEvents}>تحديث</button>
        <button className="btn btn-secondary" type="button" onClick={exportCsv} disabled={!filteredEvents.length}>تصدير CSV</button>
        <button className="status-action delete" type="button" onClick={deleteAllEvents} disabled={!events.length}>
          حذف كل سجلات الدخول
        </button>
      </div>

      {message && <div className="notice admin-notice">{message}</div>}

      <div className="login-events-list">
        {filteredEvents.map((event) => {
          const local = isLocalIp(event.ipAddress);
          return (
            <article className="login-event-card" key={event.id}>
              <div className="login-event-main">
                <div>
                  <h3>{event.userName || "مستخدم غير معروف"}</h3>
                  <p>{event.userEmail || "لا يوجد بريد محفوظ"}</p>
                </div>
                <div className="login-event-badges">
                  <span className={event.eventType === "register" ? "status-badge accepted" : "status-badge pending"}>
                    {eventLabels[event.eventType] || event.eventType}
                  </span>
                  {local && <span className="status-badge rejected">محلي</span>}
                </div>
                <span>{new Date(event.createdAt).toLocaleString("ar-JO")}</span>
              </div>

              <div className="login-event-grid">
                <div><strong>IP</strong><span>{event.ipAddress || "غير معروف"}</span></div>
                <div><strong>نوع الجهاز</strong><span>{deviceLabels[event.deviceType] || event.deviceType || "غير معروف"}</span></div>
                <div><strong>المتصفح</strong><span>{event.browser || "غير معروف"}</span></div>
                <div><strong>النظام</strong><span>{event.operatingSystem || "غير معروف"}</span></div>
                <div><strong>المنصة</strong><span>{event.platform || "غير محدد"}</span></div>
                <div><strong>اللغة</strong><span>{event.language || "غير محدد"}</span></div>
              </div>

              <details className="user-agent-details">
                <summary>عرض التفاصيل التقنية</summary>
                <p>User Agent: {event.userAgent || "غير متوفر"}</p>
                {event.forwardedFor && <p>Forwarded For: {event.forwardedFor}</p>}
                {local && <p>ملاحظة: هذا IP محلي لأن الموقع يعمل على جهازك أو شبكة داخلية.</p>}
              </details>
            </article>
          );
        })}
      </div>

      {!filteredEvents.length && <div className="info-card center">لا توجد سجلات دخول مطابقة.</div>}
    </section>
  );
}
