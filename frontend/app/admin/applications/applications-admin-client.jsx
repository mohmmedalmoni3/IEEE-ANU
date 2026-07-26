"use client";

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bot } from "lucide-react";

const statuses = ["قيد المراجعة", "مقبول", "مرفوض", "بحاجة لمقابلة", "إعادة المقابلة"];

function statusClass(status) {
  if (status === "مقبول") return "accepted";
  if (status === "مرفوض") return "rejected";
  if (status === "بحاجة لمقابلة" || status === "إعادة المقابلة") return "interview";
  return "pending";
}

function safeCsv(value) {
  const text = String(value ?? "").replace(/\r?\n/g, " ").trim();
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export default function ApplicationsAdminClient() {
  const [applications, setApplications] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [notes, setNotes] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [settings, setSettings] = useState({
    applicationsOpen: true,
    applicationsLimit: 0
  });
  const [showSettings, setShowSettings] = useState(false);
  const [applicationsOpen, setApplicationsOpen] = useState(true);
  const [applicationsLimit, setApplicationsLimit] = useState(0);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState({});

  useEffect(() => {
    Promise.all([
      apiGet("/applications"),
      apiGet("/settings")
    ])
      .then(([applicationsData, settingsData]) => {
        const items = applicationsData.applications || [];
        setApplications(items);
        setNotes(Object.fromEntries(items.map((item) => [item.id, item.adminNote || ""])));
        
        const settingsMap = settingsData.settings || {};
        setSettings({
          applicationsOpen: settingsMap.applications_open === 'true',
          applicationsLimit: parseInt(settingsMap.applications_limit || '0')
        });
        setApplicationsOpen(settingsMap.applications_open === 'true');
        setApplicationsLimit(parseInt(settingsMap.applications_limit || '0'));
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredApplications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return applications.filter((application) => {
      const matchesStatus = statusFilter === "all" || application.status === statusFilter;
      const searchable = [
        application.fullName,
        application.universityEmail,
        application.country,
        application.experience,
        application.status,
        application.skills?.join(" "),
        application.whyJoin,
        application.referral
      ].join(" ").toLowerCase();

      return matchesStatus && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [applications, query, statusFilter]);

  const statusCounts = useMemo(() => {
    return statuses.reduce((counts, status) => {
      counts[status] = applications.filter((application) => application.status === status).length;
      return counts;
    }, {});
  }, [applications]);

  async function updateApplication(id, status) {
    setMessage("");
    try {
      const data = await apiPatch(`/applications/${id}/status`, {
        status,
        adminNote: notes[id] || ""
      });
      setApplications((items) => items.map((item) => (item.id === id ? data.application : item)));
      setNotes((current) => ({ ...current, [id]: data.application.adminNote || "" }));
      setMessage("تم تحديث الطلب بنجاح.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteApplication(id) {
    const ok = window.confirm("هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذه العملية.");
    if (!ok) return;

    setMessage("");
    try {
      await apiDelete(`/applications/${id}`);
      setApplications((items) => items.filter((item) => item.id !== id));
      setNotes((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      if (expandedId === id) setExpandedId(null);
      setMessage("تم حذف الطلب بنجاح.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function saveSettings() {
    setMessage("");
    try {
      const data = await apiPatch("/settings", {
        applicationsOpen,
        applicationsLimit
      });
      const settingsMap = data.settings || {};
      setSettings({
        applicationsOpen: settingsMap.applications_open === 'true',
        applicationsLimit: parseInt(settingsMap.applications_limit || '0')
      });
      setMessage("تم تحديث الإعدادات بنجاح.");
      setShowSettings(false);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function analyzeWithAI(applicationId) {
    setAnalyzingId(applicationId);
    setMessage("");
    try {
      const data = await apiPost("/ai/analyze-application", { applicationId });
      if (data.success) {
        setAiAnalysis((prev) => ({ ...prev, [applicationId]: data.analysis }));
        setMessage("تم تحليل الطلب بنجاح.");
      } else {
        setMessage(data.analysis || "حدث خطأ في التحليل.");
      }
    } catch (error) {
      setMessage(error.message || "حدث خطأ في الاتصال بالذكاء الاصطناعي.");
    } finally {
      setAnalyzingId(null);
    }
  }

  function exportCsv() {
    const headers = [
      "الاسم",
      "البريد الجامعي",
      "العمر",
      "الدولة",
      "الساعات",
      "الخبرة",
      "المهارات",
      "كيف تعرف علينا",
      "سبب الانضمام",
      "الحالة",
      "ملاحظة المدير",
      "تاريخ الإرسال",
      "آخر تحديث"
    ];

    const rows = filteredApplications.map((application) => [
      application.fullName,
      application.universityEmail,
      application.age,
      application.country,
      application.hours,
      application.experience,
      application.skills?.join("، "),
      application.referral,
      application.whyJoin,
      application.status,
      application.adminNote,
      application.createdAt,
      application.updatedAt
    ]);

    const csv = [headers, ...rows].map((row) => row.map(safeCsv).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ieee-anu-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <section className="page-content">
        <div className="info-card center">جاري تحميل الطلبات...</div>
      </section>
    );
  }

  if (message && !applications.length) {
    return (
      <section className="page-content narrow">
        <div className="info-card center">
          <h3>{message}</h3>
          <p>تأكد من تسجيل الدخول بحساب مدير.</p>
          <Link className="apply-btn" href="/login">تسجيل الدخول</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page-content">
      <div className="admin-toolbar">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="بحث بالاسم، البريد، الدولة، المهارات..."
          aria-label="بحث في الطلبات"
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="فلترة حسب الحالة">
          <option value="all">كل الحالات</option>
          {statuses.map((status) => <option key={status}>{status}</option>)}
        </select>
        <button className="btn btn-secondary" type="button" onClick={() => setShowSettings(!showSettings)}>
          {showSettings ? "إخفاء الإعدادات" : "إعدادات الطلبات"}
        </button>
        <button className="btn btn-secondary" type="button" onClick={exportCsv} disabled={!filteredApplications.length}>
          تصدير CSV
        </button>
      </div>

      {showSettings && (
        <div className="info-card" style={{ marginBottom: "20px" }}>
          <h3>إعدادات الطلبات</h3>
          <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
            <label>
              <input
                type="checkbox"
                checked={applicationsOpen}
                onChange={(e) => setApplicationsOpen(e.target.checked)}
                style={{ marginLeft: "8px" }}
              />
              فتح استقبال الطلبات
            </label>
            <label>
              حد عدد الطلبات (0 = بدون حدود)
              <input
                type="number"
                min="0"
                value={applicationsLimit}
                onChange={(e) => setApplicationsLimit(parseInt(e.target.value) || 0)}
                style={{ marginTop: "8px" }}
              />
            </label>
            <button className="btn btn-primary" type="button" onClick={saveSettings}>
              حفظ الإعدادات
            </button>
          </div>
        </div>
      )}

      {message && <div className="notice admin-notice">{message}</div>}

      <div className="admin-summary">
        <span className="admin-metric total">إجمالي الطلبات <strong>{applications.length}</strong></span>
        <span className="admin-metric visible">المعروض الآن <strong>{filteredApplications.length}</strong></span>
        {statuses.map((status) => (
          <span className={`admin-metric ${statusClass(status)}`} key={status}>
            {status} <strong>{statusCounts[status] || 0}</strong>
          </span>
        ))}
      </div>

      <div className="admin-application-list">
        {filteredApplications.map((application) => {
          const expanded = expandedId === application.id;
          return (
            <article className="admin-application-card" key={application.id}>
              <div className="application-row-main">
                <div>
                  <h3>{application.fullName}</h3>
                  <p>{application.universityEmail}</p>
                </div>
                <span className={`status-badge ${statusClass(application.status)}`}>{application.status}</span>
                <div className="quick-actions">
                  {statuses.filter((status) => status !== "قيد المراجعة").map((status) => (
                    <button
                      key={status}
                      className={`status-action ${statusClass(status)}`}
                      type="button"
                      onClick={() => updateApplication(application.id, status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <button className="details-toggle" type="button" onClick={() => setExpandedId(expanded ? null : application.id)}>
                  {expanded ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                </button>
              </div>

              {expanded && (
                <div className="application-details-panel">
                  <div className="details-grid">
                    <div><strong>العمر</strong><span>{application.age}</span></div>
                    <div><strong>الدولة</strong><span>{application.country}</span></div>
                    <div><strong>الساعات الأسبوعية</strong><span>{application.hours || "غير محدد"}</span></div>
                    <div><strong>الخبرة</strong><span>{application.experience}</span></div>
                    <div><strong>المهارات</strong><span>{application.skills?.join("، ") || "غير محدد"}</span></div>
                    <div><strong>كيف تعرف علينا</strong><span>{application.referral || "غير محدد"}</span></div>
                    <div><strong>تاريخ الإرسال</strong><span>{new Date(application.createdAt).toLocaleString("ar-JO")}</span></div>
                    <div><strong>آخر تحديث</strong><span>{new Date(application.updatedAt || application.createdAt).toLocaleString("ar-JO")}</span></div>
                  </div>

                  <div className="long-answer">
                    <strong>سبب الانضمام</strong>
                    <p>{application.whyJoin}</p>
                  </div>

                  <div className="ai-analysis-section">
                    <div className="ai-analysis-header">
                      <strong>تحليل الذكاء الاصطناعي</strong>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => analyzeWithAI(application.id)}
                        disabled={analyzingId === application.id}
                      >
                        {analyzingId === application.id ? "جاري التحليل..." : <><Bot size={16} style={{ marginLeft: "8px" }} /> تحليل بالذكاء الاصطناعي</>}
                      </button>
                    </div>
                    {aiAnalysis[application.id] && (
                      <div className="ai-analysis-content">
                        {aiAnalysis[application.id]}
                      </div>
                    )}
                  </div>

                  <label className="admin-note-field">
                    ملاحظات المدير
                    <textarea
                      value={notes[application.id] || ""}
                      onChange={(event) => setNotes((current) => ({ ...current, [application.id]: event.target.value }))}
                      rows={4}
                      placeholder="اكتب ملاحظة تظهر مع الطلب وتحفظ عند تحديث الحالة..."
                    />
                  </label>

                  <div className="details-actions">
                    <button className="status-action pending" type="button" onClick={() => updateApplication(application.id, "قيد المراجعة")}>
                      إرجاع للمراجعة
                    </button>
                    <button className="status-action accepted" type="button" onClick={() => updateApplication(application.id, "مقبول")}>
                      قبول
                    </button>
                    <button className="status-action interview" type="button" onClick={() => updateApplication(application.id, "بحاجة لمقابلة")}>
                      مقابلة
                    </button>
                    <button className="status-action interview" type="button" onClick={() => updateApplication(application.id, "إعادة المقابلة")}>
                      إعادة المقابلة
                    </button>
                    <button className="status-action rejected" type="button" onClick={() => updateApplication(application.id, "مرفوض")}>
                      رفض
                    </button>
                    <button className="status-action delete" type="button" onClick={() => deleteApplication(application.id)}>
                      حذف الطلب
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {!filteredApplications.length && <div className="info-card center">لا توجد طلبات مطابقة للبحث الحالي.</div>}
    </section>
  );
}
