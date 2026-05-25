"use client";

import { apiGet, apiPatch } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function NotificationsAdminClient() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    apiGet("/admin/notifications")
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id) {
    await apiPatch(`/admin/notifications/${id}/read`, {});
    load();
  }

  async function markAllRead() {
    await apiPatch("/admin/notifications/read-all", {});
    load();
  }

  if (loading) {
    return <section className="page-content"><div className="info-card center">جاري تحميل التنبيهات...</div></section>;
  }

  return (
    <section className="page-content">
      <div className="admin-toolbar">
        <span className="admin-metric pending">غير مقروء <strong>{unreadCount}</strong></span>
        <button className="btn btn-secondary" type="button" onClick={markAllRead} disabled={!unreadCount}>تعليم الكل كمقروء</button>
        <Link className="btn btn-secondary admin-toolbar-link" href="/admin/activity">سجل النشاط</Link>
      </div>

      {message && <div className="notice admin-notice">{message}</div>}

      <div className="notification-list">
        {notifications.map((item) => (
          <article className={item.isRead ? "notification-card read" : "notification-card"} key={item.id}>
            <div>
              <h3>{item.title}</h3>
              <p>{item.message}</p>
              <span>{new Date(item.createdAt).toLocaleString("ar-JO")}</span>
            </div>
            {!item.isRead && (
              <button className="status-action accepted" type="button" onClick={() => markRead(item.id)}>
                تم الاطلاع
              </button>
            )}
          </article>
        ))}
      </div>

      {!notifications.length && <div className="info-card center">لا توجد تنبيهات بعد.</div>}
    </section>
  );
}
