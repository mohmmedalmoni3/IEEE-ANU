"use client";

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { CalendarDays, Clock3, Plus, Trash2, Users } from "lucide-react";
import WorkshopDateTimePicker from "@/components/WorkshopDateTimePicker";
import { useEffect, useState } from "react";

const emptyForm = {
  title: "", description: "", speaker: "", location: "", startsAt: "", endsAt: "",
  registrationOpensAt: "", registrationClosesAt: "", maxRegistrations: "",
  isVisible: true, isRegistrationOpen: true, fields: []
};

function toLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toPayload(form) {
  const asIso = (value) => value ? new Date(value).toISOString() : null;
  return {
    ...form,
    startsAt: asIso(form.startsAt),
    endsAt: asIso(form.endsAt),
    registrationOpensAt: asIso(form.registrationOpensAt),
    registrationClosesAt: asIso(form.registrationClosesAt),
    maxRegistrations: form.maxRegistrations || null,
    fields: form.fields.map((field) => ({ ...field, options: field.options || "" }))
  };
}

function formatDate(value) {
  return value ? new Date(value).toLocaleString("ar-JO") : "غير محدد";
}

export default function WorkshopsAdminClient() {
  const [workshops, setWorkshops] = useState([]);
  const [registrations, setRegistrations] = useState({});
  const [expanded, setExpanded] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadWorkshops() {
    try {
      const data = await apiGet("/admin/workshops");
      setWorkshops(data.workshops || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadWorkshops(); }, []);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startEdit(workshop) {
    setEditingId(workshop.id);
    setForm({
      title: workshop.title || "", description: workshop.description || "", speaker: workshop.speaker || "",
      location: workshop.location || "", startsAt: toLocalInput(workshop.startsAt), endsAt: toLocalInput(workshop.endsAt),
      registrationOpensAt: toLocalInput(workshop.registrationOpensAt), registrationClosesAt: toLocalInput(workshop.registrationClosesAt),
      maxRegistrations: workshop.maxRegistrations || "", isVisible: workshop.isVisible,
      isRegistrationOpen: workshop.isRegistrationOpen,
      fields: (workshop.fields || []).map((field) => ({ ...field, options: (field.options || []).join("\n") }))
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addField() {
    setForm((current) => ({
      ...current,
      fields: [...current.fields, { id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, label: "", type: "text", required: false, options: "" }]
    }));
  }

  function updateField(index, key, value) {
    setForm((current) => ({ ...current, fields: current.fields.map((field, i) => i === index ? { ...field, [key]: value } : field) }));
  }

  async function save(event) {
    event.preventDefault();
    if (!form.startsAt || !form.endsAt) {
      setMessage("حدد موعد بداية الورشة ونهايتها.");
      return;
    }
    if (form.endsAt <= form.startsAt) {
      setMessage("موعد نهاية الورشة يجب أن يكون بعد موعد بدايتها.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const payload = toPayload(form);
      if (editingId) await apiPatch(`/admin/workshops/${editingId}`, payload);
      else await apiPost("/admin/workshops", payload);
      setMessage(editingId ? "تم تحديث الورشة." : "تم إنشاء الورشة.");
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      await loadWorkshops();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleRegistration(workshop) {
    try {
      const payload = toPayload({
        ...workshop,
        startsAt: toLocalInput(workshop.startsAt), endsAt: toLocalInput(workshop.endsAt),
        registrationOpensAt: toLocalInput(workshop.registrationOpensAt), registrationClosesAt: toLocalInput(workshop.registrationClosesAt),
        maxRegistrations: workshop.maxRegistrations || "",
        fields: (workshop.fields || []).map((field) => ({ ...field, options: (field.options || []).join("\n") }))
      });
      await apiPatch(`/admin/workshops/${workshop.id}`, { ...payload, isRegistrationOpen: !workshop.isRegistrationOpen });
      setMessage(workshop.isRegistrationOpen ? "تم إيقاف التسجيل." : "تم فتح التسجيل.");
      await loadWorkshops();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function removeWorkshop(workshop) {
    if (!window.confirm(`حذف ورشة «${workshop.title}» وجميع تسجيلاتها؟`)) return;
    try {
      await apiDelete(`/admin/workshops/${workshop.id}`);
      setMessage("تم حذف الورشة وتسجيلاتها.");
      await loadWorkshops();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function toggleRegistrations(id) {
    const next = !expanded[id];
    setExpanded((current) => ({ ...current, [id]: next }));
    if (next && !registrations[id]) {
      try {
        const data = await apiGet(`/admin/workshops/${id}/registrations`);
        setRegistrations((current) => ({ ...current, [id]: data.registrations || [] }));
      } catch (error) {
        setMessage(error.message);
      }
    }
  }

  async function removeRegistration(workshopId, registrationId) {
    try {
      await apiDelete(`/admin/workshops/${workshopId}/registrations/${registrationId}`);
      setRegistrations((current) => ({ ...current, [workshopId]: current[workshopId].filter((item) => item.id !== registrationId) }));
      await loadWorkshops();
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (loading) return <section className="page-content"><div className="info-card center">جاري تحميل الورش...</div></section>;

  return (
    <section className="page-content workshop-admin-page">
      <div className="admin-toolbar">
        <button className="btn btn-primary" type="button" onClick={() => { setShowForm((value) => !value); setEditingId(null); setForm(emptyForm); }}>
          <Plus size={18} /> {showForm ? "إخفاء النموذج" : "إنشاء ورشة"}
        </button>
      </div>
      {message && <div className="notice admin-notice">{message}</div>}

      {showForm && <form className="info-card workshop-editor" onSubmit={save}>
        <h2>{editingId ? "تعديل الورشة" : "إنشاء ورشة جديدة"}</h2>
        <div className="content-form-grid">
          <label>عنوان الورشة<input value={form.title} onChange={(e) => update("title", e.target.value)} required /></label>
          <label>المدرب أو المتحدث<input value={form.speaker} onChange={(e) => update("speaker", e.target.value)} /></label>
          <label>المكان أو رابط الحضور<input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="القاعة أو رابط الاجتماع" /></label>
        </div>
        <label className="workshop-wide-field">وصف الورشة<textarea rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} /></label>

        <div className="workshop-schedule-section">
          <div className="workshop-schedule-header">
            <div>
              <h3>الجدول الزمني للورشة</h3>
              <p>حدد موعد البداية والنهاية؛ سيظهر للزوار حسب التوقيت المحلي لديهم.</p>
            </div>
            <span className="workshop-timezone-note"><Clock3 size={15} /> توقيت جهازك</span>
          </div>
          <div className="workshop-schedule-range">
            <div className="workshop-schedule-point">
              <span className="workshop-schedule-point-title"><span className="workshop-schedule-icon start"><CalendarDays size={19} /></span><span><strong>تبدأ الورشة</strong><small>اليوم والساعة</small></span></span>
              <WorkshopDateTimePicker value={form.startsAt} onChange={(value) => update("startsAt", value)} label="موعد بداية الورشة" placeholder="اختر موعد البداية" />
            </div>
            <span className="workshop-schedule-connector" aria-hidden="true">إلى</span>
            <div className="workshop-schedule-point">
              <span className="workshop-schedule-point-title"><span className="workshop-schedule-icon end"><Clock3 size={19} /></span><span><strong>تنتهي الورشة</strong><small>اليوم والساعة</small></span></span>
              <WorkshopDateTimePicker value={form.endsAt} onChange={(value) => update("endsAt", value)} label="موعد نهاية الورشة" placeholder="اختر موعد النهاية" minValue={form.startsAt} />
            </div>
          </div>
        </div>

        <div className="workshop-registration-window">
          <div>
            <h3>موعد فتح وإغلاق التسجيل</h3>
            <p>اختياري؛ اترك الموعدين فارغين ليبقى التسجيل متاحًا حسب زر الفتح والإغلاق والسعة.</p>
          </div>
          <div className="workshop-registration-window-grid">
            <div className="workshop-date-time-field"><span>يفتح التسجيل في</span><WorkshopDateTimePicker value={form.registrationOpensAt} onChange={(value) => update("registrationOpensAt", value)} label="موعد فتح التسجيل" placeholder="بدون موعد محدد" allowClear /></div>
            <div className="workshop-date-time-field"><span>يغلق التسجيل في</span><WorkshopDateTimePicker value={form.registrationClosesAt} onChange={(value) => update("registrationClosesAt", value)} label="موعد إغلاق التسجيل" placeholder="بدون موعد محدد" allowClear minValue={form.registrationOpensAt} /></div>
            <label className="workshop-capacity-field">الحد الأقصى للمسجلين<input type="number" min="1" value={form.maxRegistrations} onChange={(e) => update("maxRegistrations", e.target.value)} placeholder="بلا حد" /></label>
          </div>
        </div>

        <div className="workshop-field-editor">
          <div className="workshop-field-heading"><div><h3>حقول نموذج التسجيل</h3><p>الاسم والبريد والهاتف موجودة تلقائيًا.</p></div><button className="btn btn-secondary" type="button" onClick={addField}><Plus size={16} /> إضافة حقل</button></div>
          {form.fields.length === 0 && <p className="workshop-empty-fields">يمكنك إضافة أسئلة أو بيانات خاصة بالورشة.</p>}
          {form.fields.map((field, index) => <div className="workshop-custom-field" key={field.id}>
            <label>عنوان الحقل<input value={field.label} onChange={(e) => updateField(index, "label", e.target.value)} required placeholder="مثال: التخصص الدراسي" /></label>
            <label>نوع الإجابة<select value={field.type} onChange={(e) => updateField(index, "type", e.target.value)}><option value="text">نص قصير</option><option value="textarea">نص طويل</option><option value="number">رقم</option><option value="select">قائمة خيارات</option></select></label>
            {field.type === "select" && <label>الخيارات (خيار في كل سطر)<textarea rows={2} value={field.options} onChange={(e) => updateField(index, "options", e.target.value)} required /></label>}
            <label className="workshop-required-toggle"><input type="checkbox" checked={field.required} onChange={(e) => updateField(index, "required", e.target.checked)} /> إجابة مطلوبة</label>
            <button className="btn btn-danger workshop-remove-field" type="button" aria-label="حذف الحقل" onClick={() => setForm((current) => ({ ...current, fields: current.fields.filter((_, i) => i !== index) }))}><Trash2 size={17} /></button>
          </div>)}
        </div>

        <div className="live-workshop-switches workshop-admin-switches">
          <label><input type="checkbox" checked={form.isVisible} onChange={(e) => update("isVisible", e.target.checked)} /> إظهار الورشة للمستخدمين</label>
          <label><input type="checkbox" checked={form.isRegistrationOpen} onChange={(e) => update("isRegistrationOpen", e.target.checked)} /> فتح التسجيل</label>
        </div>
        <div className="details-actions">
          <button className="submit-btn" type="submit" disabled={saving}>{saving ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إنشاء الورشة"}</button>
          <button className="btn btn-secondary" type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}>إلغاء</button>
        </div>
      </form>}

      <div className="workshop-admin-list">
        {!workshops.length ? <div className="info-card center">لا توجد ورش مضافة حتى الآن.</div> : workshops.map((workshop) => (
          <article className="info-card workshop-admin-card" key={workshop.id}>
            <div className="workshop-admin-card-top"><div><h2>{workshop.title}</h2><p>{workshop.description || "لا يوجد وصف"}</p></div><span className={workshop.isRegistrationAvailable ? "workshop-status open" : "workshop-status closed"}>{workshop.isRegistrationAvailable ? "التسجيل متاح" : "التسجيل مغلق"}</span></div>
            <div className="workshop-admin-meta"><span>الورشة: {formatDate(workshop.startsAt)} — {formatDate(workshop.endsAt)}</span><span><Users size={16} /> {workshop.registeredCount}{workshop.maxRegistrations ? ` / ${workshop.maxRegistrations}` : " مسجل"}</span><span>{workshop.isVisible ? "ظاهرة للمستخدمين" : "مخفية"}</span></div>
            <div className="workshop-admin-actions">
              <button className="btn btn-secondary" type="button" onClick={() => startEdit(workshop)}>تعديل</button>
              <button className="btn btn-secondary" type="button" onClick={() => toggleRegistration(workshop)}>{workshop.isRegistrationOpen ? "إيقاف التسجيل" : "فتح التسجيل"}</button>
              <button className="btn btn-secondary" type="button" onClick={() => toggleRegistrations(workshop.id)}>{expanded[workshop.id] ? "إخفاء المسجلين" : "عرض المسجلين"}</button>
              <button className="btn btn-danger" type="button" onClick={() => removeWorkshop(workshop)}><Trash2 size={16} /> حذف الورشة</button>
            </div>
            {expanded[workshop.id] && <div className="workshop-registrations">
              {!registrations[workshop.id]?.length ? <p>لا يوجد مسجلون حتى الآن.</p> : registrations[workshop.id].map((registration) => (
                <article className="workshop-registration-row" key={registration.id}>
                  <div><strong>{registration.fullName}</strong><span>{registration.email}{registration.phone ? ` · ${registration.phone}` : ""}</span>{Object.entries(registration.answers || {}).map(([key, value]) => { const field = workshop.fields.find((item) => item.id === key); return value ? <small key={key}>{field?.label || key}: {value}</small> : null; })}</div>
                  <div className="workshop-registration-controls"><time>{formatDate(registration.createdAt)}</time><button type="button" className="btn btn-danger" onClick={() => removeRegistration(workshop.id, registration.id)} aria-label="حذف التسجيل"><Trash2 size={15} /></button></div>
                </article>
              ))}
            </div>}
          </article>
        ))}
      </div>
    </section>
  );
}
