"use client";

import { apiGet, apiPost } from "@/lib/api";
import { CalendarDays, CheckCircle2, LoaderCircle, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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
  const [workshopList, setWorkshopList] = useState(workshops);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [values, setValues] = useState({});
  const [states, setStates] = useState({});
  const [registeredIds, setRegisteredIds] = useState(() => new Set(workshops.filter((workshop) => workshop.isRegistered).map((workshop) => workshop.id)));

  useEffect(() => {
    let active = true;
    apiGet("/workshops")
      .then((data) => {
        if (!active) return;
        const publicWorkshops = data.workshops || workshops;
        setWorkshopList(publicWorkshops);
        setIsAuthenticated(Boolean(data.authenticated));
        setRegisteredIds(new Set(publicWorkshops.filter((workshop) => workshop.isRegistered).map((workshop) => workshop.id)));
        if (data.user) {
          setValues((current) => {
            const next = { ...current };
            for (const workshop of publicWorkshops) {
              next[workshop.id] = { ...current[workshop.id], fullName: data.user.fullName, email: data.user.email };
            }
            return next;
          });
        }
      })
      .catch(() => {
        if (active) setIsAuthenticated(false);
      });
    return () => { active = false; };
  }, [workshops]);

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
      setRegisteredIds((current) => new Set([...current, workshop.id]));
      setValues((current) => ({ ...current, [workshop.id]: {} }));
    } catch (error) {
      if (error.message?.includes("أنت مسجل بالفعل")) {
        setRegisteredIds((current) => new Set([...current, workshop.id]));
        setStates((current) => ({ ...current, [workshop.id]: { loading: false, success: true, message: "أنت مسجل في هذه الورشة" } }));
        return;
      }
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

  if (!workshopList.length) return null;

  return (
    <section className="public-workshops-section" id="workshops">
      <div className="section-header">
        <h2>ورش قادمة</h2>
        <p>سجّل في الورشة المناسبة، وستصلك تفاصيلها وفق المعلومات الموضحة.</p>
      </div>
      <div className="public-workshops-grid">
        {workshopList.map((workshop) => {
          const current = values[workshop.id] || {};
          const state = states[workshop.id] || {};
          const isRegistered = registeredIds.has(workshop.id) || Boolean(workshop.isRegistered);
          const registrationAvailable = Boolean(workshop.isRegistrationAvailable);
          return (
            <article className="public-workshop-card" key={workshop.id}>
              <div className="public-workshop-heading">
                <span className={isRegistered || registrationAvailable ? "workshop-status open" : "workshop-status closed"}>{isRegistered ? "أنت مسجل" : registrationAvailable ? "التسجيل مفتوح" : "التسجيل مغلق"}</span>
                <span className="public-workshop-capacity"><Users size={15} /> {workshop.registeredCount}{workshop.maxRegistrations ? ` / ${workshop.maxRegistrations}` : " مسجل"}</span>
              </div>
              <h3>{workshop.title}</h3>
              {workshop.description && <p className="public-workshop-description">{workshop.description}</p>}
              <div className="public-workshop-details">
                <span><CalendarDays size={16} /> {displayDate(workshop.startsAt)}{workshop.endsAt ? ` — ${displayDate(workshop.endsAt)}` : ""}</span>
                {workshop.speaker && <span>المدرب: {workshop.speaker}</span>}
                {workshop.location && <span><MapPin size={16} /> {workshop.location}</span>}
              </div>

              {isRegistered ? <div className="workshop-already-registered" role="status"><CheckCircle2 size={21} /><div><strong>أنت مسجل في هذه الورشة</strong><span>تم حفظ تسجيلك على حسابك. لا تحتاج إلى التسجيل مرة أخرى.</span></div></div> :
                registrationAvailable && isAuthenticated === true ? <form className="public-workshop-form" onSubmit={(event) => submit(event, workshop)}>
                <div className="public-workshop-form-grid">
                  <label>الاسم الكامل<input value={current.fullName || ""} readOnly autoComplete="name" /></label>
                  <label>البريد الإلكتروني<input type="email" value={current.email || ""} readOnly autoComplete="email" /></label>
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
              </form> : registrationAvailable && isAuthenticated === false ? <div className="workshop-login-to-register"><p>سجّل الدخول بحسابك لإتمام التسجيل في الورشة.</p><Link href="/login" className="submit-btn">تسجيل الدخول</Link></div> :
                registrationAvailable ? <p className="public-workshop-closed-note"><LoaderCircle size={16} className="workshop-check-spinner" /> جارٍ التحقق من حالة التسجيل...</p> :
                  <p className="public-workshop-closed-note">{getRegistrationMessage(workshop)}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
