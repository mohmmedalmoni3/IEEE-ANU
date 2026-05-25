"use client";

import { apiDelete, apiGet } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ActivityAdminClient() {
  const [activity, setActivity] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  function loadActivity() {
    setLoading(true);
    setMessage("");
    apiGet("/admin/activity")
      .then((data) => setActivity(data.activity || []))
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadActivity();
  }, []);

  async function deleteAllActivity() {
    const ok = window.confirm("هل أنت متأكد من حذف كل سجل نشاط الأدمن؟ لا يمكن التراجع عن هذه العملية.");
    if (!ok) return;

    try {
      await apiDelete("/admin/activity");
      setActivity([]);
      setMessage("تم حذف كل سجلات النشاط بنجاح.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (loading) {
    return <section className="page-content"><div className="info-card center">جاري تحميل سجل النشاط...</div></section>;
  }

  if (message && !activity.length) {
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
      {message && <div className="notice admin-notice">{message}</div>}
      <div className="admin-toolbar">
        <Link className="btn btn-secondary admin-toolbar-link" href="/admin/notifications">التنبيهات</Link>
        <Link className="btn btn-secondary admin-toolbar-link" href="/admin/content">إدارة المحتوى</Link>
        <button className="status-action delete" type="button" onClick={deleteAllActivity} disabled={!activity.length}>
          حذف كل سجل النشاط
        </button>
      </div>

      <div className="admin-timeline">
        {activity.map((item) => (
          <article className="timeline-item" key={item.id}>
            <div className="timeline-dot" />
            <div className="timeline-card">
              <div>
                <h3>{item.description}</h3>
                <p>{item.adminName || "النظام"} • {item.action}</p>
              </div>
              <span>{new Date(item.createdAt).toLocaleString("ar-JO")}</span>
            </div>
          </article>
        ))}
      </div>

      {!activity.length && <div className="info-card center">لا يوجد نشاط محفوظ بعد.</div>}
    </section>
  );
}
