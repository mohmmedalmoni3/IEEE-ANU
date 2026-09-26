"use client";

import { apiPost } from "@/lib/api";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { useState } from "react";

function displayDate(value) {
  return value ? new Date(value).toLocaleString("ar-JO") : "غير محدد";
}

function getRegistrationMessage(workshop) {
  if (workshop.registrationStatus === "paused") return "أوقف مدير الورشة التسجيل حاليًا.";
  if (workshop.registrationStatus === "scheduled") return `يفتح التسجيل في ${displayDate(workshop.registrationOpensAt)}.`;
  if (workshop.registrationStatus === "ended") return "انتهى موعد التسجيل المحدد لهذه الورشة.";
  if (workshop.registrationStatus === "full") return "اكتمل عدد المقاعد المتاحة لهذه الورشة.";
  return "التسجيل غير متاح حاليًا.";
}

export default function WorkshopRegistrationSection({ workshops = [] }) {
  const [values, setValues] = useState({});
  const [states, setStates] = useState({});

  async function submit(event, workshop) {
    event.preventDefault();
    const formValues = values[workshop.id] || {};
    setStates((current) => ({ ...current, [workshop.id]: { loading: true, message: "" } }));
    try {
      const result = await apiPost(`/workshops/${workshop.id}/register`, {
        fullName: formValues.fullName,
        email: formValues.email,
        phone: formValues.phone,
        answers: formValues.answers || {}
      });
      setStates((current) => ({ ...current, [workshop.id]: { loading: false, success: true, message: result.message } }));
      setValues((current) => ({ ...current, [workshop.id]: {} }));
    } catch (error) {
      setStates((current) => ({ ...current, [workshop.id]: { loading: false, message: error.message } }));
    }
  }

  function update(workshopId, key, value) {
    setValues((current) => ({ ...current, [workshopId]: { ...current[workshopId], [key]: value } }));
  }

  function updateAnswer(workshopId, fieldId, value) {
    setValues((current) => ({
      ...current,
      [workshopId]: { ...current[workshopId], answers: { ...current[workshopId]?.answers, [fieldId]: value } }
    }));
  }

  if (!workshops.length) return null;

  return (
    <section className="public-workshops-section" id="workshops">
      <div className="section-header">
        <h2>ورش قادمة</h2>
        <p>سجّل في الورشة المناسبة، وستصلك تفاصيلها وفق المعلومات الموضحة.</p>
      </div>
      <div className="public-workshops-grid">
        {workshops.map((workshop) => {
          const current = values[workshop.id] || {};
          const state = states[workshop.id] || {};
          const registrationAvailable = Boolean(workshop.isRegistrationAvailable);
          return (
            <article className="public-workshop-card" key={workshop.id}>
              <div className="public-workshop-heading">
                <span className={registrationAvailable ? "workshop-status open" : "workshop-status closed"}>{registrationAvailable ? "التسجيل مفتوح" : "التسجيل مغلق"}</span>
                <span className="public-workshop-capacity"><Users size={15} /> {workshop.registeredCount}{workshop.maxRegistrations ? ` / ${workshop.maxRegistrations}` : " مسجل"}</span>
              </div>
              <h3>{workshop.title}</h3>
              {workshop.description && <p className="public-workshop-description">{workshop.description}</p>}
              <div className="public-workshop-details">
                <span><CalendarDays size={16} /> {displayDate(workshop.startsAt)}{workshop.endsAt ? ` — ${displayDate(workshop.endsAt)}` : ""}</span>
                {workshop.speaker && <span>المدرب: {workshop.speaker}</span>}
                {workshop.location && <span><MapPin size={16} /> {workshop.location}</span>}
              </div>

              {registrationAvailable ? <form className="public-workshop-form" onSubmit={(event) => submit(event, workshop)}>
                <div className="public-workshop-form-grid">
                  <label>الاسم الكامل<input value={current.fullName || ""} onChange={(event) => update(workshop.id, "fullName", event.target.value)} required autoComplete="name" /></label>
                  <label>البريد الإلكتروني<input type="email" value={current.email || ""} onChange={(event) => update(workshop.id, "email", event.target.value)} required autoComplete="email" /></label>
                  <label>رقم الهاتف<input type="tel" value={current.phone || ""} onChange={(event) => update(workshop.id, "phone", event.target.value)} autoComplete="tel" /></label>
                  {(workshop.fields || []).map((field) => <label key={field.id}>
                    {field.label}{field.required && <span aria-hidden="true"> *</span>}
                    {field.type === "textarea" ? <textarea rows={3} value={current.answers?.[field.id] || ""} onChange={(event) => updateAnswer(workshop.id, field.id, event.target.value)} required={field.required} /> :
                      field.type === "select" ? <select value={current.answers?.[field.id] || ""} onChange={(event) => updateAnswer(workshop.id, field.id, event.target.value)} required={field.required}><option value="">اختر إجابة</option>{(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select> :
                        <input type={field.type === "number" ? "number" : "text"} value={current.answers?.[field.id] || ""} onChange={(event) => updateAnswer(workshop.id, field.id, event.target.value)} required={field.required} />}
                  </label>)}
                </div>
                <button type="submit" className="submit-btn" disabled={state.loading || state.success}>{state.loading ? "جاري التسجيل..." : state.success ? "تم التسجيل" : "تسجيل في الورشة"}</button>
                {state.message && <p className={state.success ? "workshop-form-message success" : "workshop-form-message"} role="status">{state.message}</p>}
              </form> : <p className="public-workshop-closed-note">{getRegistrationMessage(workshop)}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
