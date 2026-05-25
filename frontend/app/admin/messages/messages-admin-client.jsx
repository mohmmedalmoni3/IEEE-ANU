"use client";

import { apiGet, apiPost } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const audienceOptions = [
  { value: "selected", label: "مستخدمون محددون" },
  { value: "all", label: "كل المستخدمين" },
  { value: "members", label: "الأعضاء فقط" },
  { value: "admins", label: "المديرون فقط" }
];

const priorityOptions = [
  { value: "normal", label: "تنبيه عادي" },
  { value: "important", label: "مهم" },
  { value: "urgent", label: "عاجل" }
];

function priorityLabel(value) {
  return priorityOptions.find((option) => option.value === value)?.label || value;
}

export default function MessagesAdminClient() {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [query, setQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    audience: "selected",
    priority: "normal",
    subject: "",
    note: "",
    supportEmail: "",
    supportUrl: ""
  });

  useEffect(() => {
    Promise.all([apiGet("/users"), apiGet("/admin/messages")])
      .then(([usersData, messagesData]) => {
        setUsers(usersData.users || []);
        setMessages(messagesData.messages || []);
      })
      .catch((error) => setNotice(error.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return users;
    return users.filter((user) => {
      return [user.firstname, user.lastname, user.username, user.email, user.role]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [users, query]);

  const expectedRecipients = useMemo(() => {
    if (form.audience === "all") return users.length;
    if (form.audience === "admins") return users.filter((user) => user.role === "admin").length;
    if (form.audience === "members") return users.filter((user) => user.role !== "admin").length;
    return selectedIds.length;
  }, [form.audience, selectedIds.length, users]);

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleUser(id) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function selectAllFiltered() {
    const ids = filteredUsers.map((user) => user.id);
    setSelectedIds((current) => Array.from(new Set([...current, ...ids])));
  }

  async function sendMessage(event) {
    event.preventDefault();
    setNotice("");
    setSending(true);

    try {
      const data = await apiPost("/admin/messages", {
        ...form,
        message: messageText,
        userIds: selectedIds
      });
      setMessages((current) => [data.result, ...current]);
      setNotice(`${data.message}. وصل بنجاح: ${data.result.sentCount} / ${data.result.recipientsCount}`);
      setForm((current) => ({ ...current, subject: "", note: "" }));
      setMessageText("");
      if (form.audience === "selected") setSelectedIds([]);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <section className="page-content">
        <div className="info-card center">جاري تحميل صفحة الرسائل...</div>
      </section>
    );
  }

  if (notice && !users.length) {
    return (
      <section className="page-content narrow">
        <div className="info-card center">
          <h3>{notice}</h3>
          <p>تأكد من تسجيل الدخول بحساب مدير.</p>
          <Link className="apply-btn" href="/login">تسجيل الدخول</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page-content admin-messages-page">
      <div className="admin-toolbar messages-toolbar">
        <Link className="btn btn-secondary admin-toolbar-link" href="/admin/users">إدارة المستخدمين</Link>
        <Link className="btn btn-secondary admin-toolbar-link" href="/admin/applications">إدارة الطلبات</Link>
        <span className="delivery-note">لن تظهر رسالة نجاح إلا بعد محاولة إرسال البريد فعليا عبر SMTP.</span>
      </div>

      {notice && <div className="notice admin-notice">{notice}</div>}

      <div className="message-admin-grid">
        <form className="message-compose-card" onSubmit={sendMessage}>
          <div className="form-header">
            <h2>إرسال رسالة بريدية</h2>
            <p>اختر الجمهور واكتب الرسالة. SMTP مطلوب لضمان وصول البريد.</p>
          </div>

          <div className="form-row">
            <label>
              الجمهور
              <select value={form.audience} onChange={(event) => updateForm("audience", event.target.value)}>
                {audienceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label>
              نوع التنبيه
              <select value={form.priority} onChange={(event) => updateForm("priority", event.target.value)}>
                {priorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>

          <label>
            عنوان الرسالة
            <input value={form.subject} onChange={(event) => updateForm("subject", event.target.value)} required placeholder="مثال: تنبيه مهم من IEEE ANU" />
          </label>

          <label>
            نص الرسالة
            <textarea value={messageText} onChange={(event) => setMessageText(event.target.value)} required rows={8} placeholder="اكتب الرسالة التي ستصل إلى البريد الإلكتروني..." />
          </label>

          <label>
            ملاحظة إضافية
            <textarea value={form.note} onChange={(event) => updateForm("note", event.target.value)} rows={3} placeholder="اختياري: ملاحظة تظهر داخل البريد..." />
          </label>

          <div className="form-row">
            <label>
              بريد الدعم الفوري
              <input value={form.supportEmail} onChange={(event) => updateForm("supportEmail", event.target.value)} placeholder="support@example.com" />
            </label>
            <label>
              رابط دعم فوري
              <input value={form.supportUrl} onChange={(event) => updateForm("supportUrl", event.target.value)} placeholder="https://wa.me/..." />
            </label>
          </div>

          <div className="message-send-summary">
            <span>عدد المستلمين المتوقع: <strong>{expectedRecipients}</strong></span>
            <button className="submit-btn" type="submit" disabled={sending || !expectedRecipients}>
              {sending ? "جاري الإرسال..." : "إرسال البريد الآن"}
            </button>
          </div>
        </form>

        <aside className="message-users-card">
          <div className="message-users-header">
            <h3>اختيار المستخدمين</h3>
            <button className="status-action pending" type="button" onClick={selectAllFiltered}>اختيار المعروض</button>
          </div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="بحث عن مستخدم..." />
          <div className="message-user-list">
            {filteredUsers.map((user) => (
              <label className="message-user-item" key={user.id}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(user.id)}
                  onChange={() => toggleUser(user.id)}
                  disabled={form.audience !== "selected"}
                />
                <span>
                  <strong>{user.firstname} {user.lastname}</strong>
                  <small>{user.email}</small>
                </span>
                <em>{user.role === "admin" ? "مدير" : "عضو"}</em>
              </label>
            ))}
          </div>
        </aside>
      </div>

      <div className="message-history">
        <h2>سجل الرسائل</h2>
        <div className="message-history-list">
          {messages.map((item) => (
            <article className="message-history-card" key={item.id}>
              <div>
                <h3>{item.subject}</h3>
                <p>{item.message}</p>
                {item.note && <small>ملاحظة: {item.note}</small>}
              </div>
              <div className="message-history-meta">
                <span className={`status-badge ${item.failedCount ? "rejected" : "accepted"}`}>
                  {item.sentCount}/{item.recipientsCount} وصل
                </span>
                <span>{priorityLabel(item.priority)}</span>
                <span>{new Date(item.createdAt).toLocaleString("ar-JO")}</span>
              </div>
            </article>
          ))}
          {!messages.length && <div className="info-card center">لا توجد رسائل محفوظة بعد.</div>}
        </div>
      </div>
    </section>
  );
}
