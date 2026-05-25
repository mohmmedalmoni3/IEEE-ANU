"use client";

import { apiGet, apiPatch } from "@/lib/api";
import { useEffect, useState } from "react";

const emptyForm = {
  title: "",
  description: "",
  meetUrl: "",
  speaker: "",
  startsAt: "",
  isLive: false,
  isVisible: true
};

export default function LiveWorkshopAdminClient() {
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet("/admin/live-workshop")
      .then((data) => {
        if (data.workshop) {
          setForm({
            title: data.workshop.title || "",
            description: data.workshop.description || "",
            meetUrl: data.workshop.meetUrl || "",
            speaker: data.workshop.speaker || "",
            startsAt: data.workshop.startsAt || "",
            isLive: Boolean(data.workshop.isLive),
            isVisible: Boolean(data.workshop.isVisible)
          });
        }
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const data = await apiPatch("/admin/live-workshop", form);
      setForm({
        title: data.workshop.title || "",
        description: data.workshop.description || "",
        meetUrl: data.workshop.meetUrl || "",
        speaker: data.workshop.speaker || "",
        startsAt: data.workshop.startsAt || "",
        isLive: Boolean(data.workshop.isLive),
        isVisible: Boolean(data.workshop.isVisible)
      });
      setMessage("تم تحديث الورشة المباشرة بنجاح.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <section className="page-content"><div className="info-card center">جاري تحميل إعدادات الورشة...</div></section>;
  }

  return (
    <section className="page-content admin-live-workshop-page">
      {message && <div className="notice admin-notice">{message}</div>}

      <form className="live-workshop-admin-card" onSubmit={save}>
        <div className="form-header">
          <h2>بيانات الورشة</h2>
          <p>عند تفعيل “مباشر الآن” ستظهر الورشة في الصفحة الرئيسية، ورابط Google Meet يبقى مخفيًا إلا للأعضاء المسجلين.</p>
        </div>

        <div className="content-form-grid">
          <label>
            عنوان الورشة
            <input value={form.title} onChange={(event) => updateField("title", event.target.value)} required placeholder="مثال: ورشة Git و GitHub" />
          </label>
          <label>
            رابط Google Meet
            <input value={form.meetUrl} onChange={(event) => updateField("meetUrl", event.target.value)} required placeholder="https://meet.google.com/..." />
          </label>
          <label>
            المتحدث
            <input value={form.speaker} onChange={(event) => updateField("speaker", event.target.value)} placeholder="اسم المدرب أو المتحدث" />
          </label>
          <label>
            الموعد
            <input value={form.startsAt} onChange={(event) => updateField("startsAt", event.target.value)} placeholder="الأحد 8:00 مساءً" />
          </label>
        </div>

        <label className="admin-note-field">
          وصف الورشة
          <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={4} placeholder="اكتب وصفًا مختصرًا يظهر في الصفحة الرئيسية..." />
        </label>

        <div className="live-workshop-switches">
          <label>
            <input type="checkbox" checked={form.isVisible} onChange={(event) => updateField("isVisible", event.target.checked)} />
            إظهار الورشة على الصفحة الرئيسية
          </label>
          <label>
            <input type="checkbox" checked={form.isLive} onChange={(event) => updateField("isLive", event.target.checked)} />
            الورشة مباشرة الآن
          </label>
        </div>

        <div className="details-actions">
          <button className="submit-btn" type="submit" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ إعدادات الورشة"}</button>
        </div>
      </form>

      <div className={form.isLive ? "live-workshop-card live preview" : "live-workshop-card preview"}>
        <div className="live-workshop-status">
          <span className="live-dot" />
          <strong>{form.isLive ? "بث مباشر الآن" : "ورشة قادمة"}</strong>
        </div>
        <h2>{form.title || "عنوان الورشة"}</h2>
        <p>{form.description || "سيظهر وصف الورشة هنا في الصفحة الرئيسية."}</p>
        <div className="live-workshop-meta">
          {form.speaker && <span>المتحدث: {form.speaker}</span>}
          {form.startsAt && <span>الموعد: {form.startsAt}</span>}
        </div>
      </div>
    </section>
  );
}
