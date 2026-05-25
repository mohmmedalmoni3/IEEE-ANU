"use client";

import { apiGet, apiPost } from "@/lib/api";
import { CheckCircle, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const skills = ["مونتاج", "تصميم", "برمجة", "إدارة", "دعم فني"];

export default function ApplicationForm() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [existingApplication, setExistingApplication] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(true);

  useEffect(() => {
    apiGet("/applications/me")
      .then((data) => setExistingApplication(data.applications?.[0] || null))
      .catch(() => setExistingApplication(null))
      .finally(() => setCheckingExisting(false));
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form);
    payload.skills = form.getAll("skills");

    try {
      await apiPost("/applications", payload);
      formElement.reset();
      setDone(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (checkingExisting) {
    return (
      <div className="application-form center">
        <h3>جاري التحقق من حالة طلبك...</h3>
      </div>
    );
  }

  if (existingApplication) {
    return (
      <div className="application-form center">
        <CheckCircle size={62} />
        <h3>لديك طلب انضمام مسجل بالفعل</h3>
        <p>لا تحتاج لإرسال طلب جديد. يمكنك متابعة حالة طلبك من الملف الشخصي.</p>
        <div className="application-status-card compact">
          <strong>الحالة الحالية</strong>
          <span className="status-badge pending">{existingApplication.status}</span>
        </div>
        <Link className="apply-btn" href="/profile">عرض الملف الشخصي</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="success-message">
        <CheckCircle size={70} />
        <h3>تم إرسال طلبك بنجاح</h3>
        <p>سيتم مراجعة الطلب وتحديث حالته في ملفك الشخصي.</p>
        <Link className="close-success" href="/profile">متابعة حالة الطلب</Link>
      </div>
    );
  }

  return (
    <form className="application-form" onSubmit={submit}>
      <div className="form-header">
        <h2>نموذج الانضمام إلى IEEE ANU</h2>
        <p>يرجى تعبئة الحقول بدقة حتى يصل الطلب بشكل واضح للفريق.</p>
      </div>
      {error && <div className="notice error">{error}</div>}
      <label>الاسم الكامل<input name="fullName" required placeholder="الاسم الرباعي" /></label>
      <label>البريد الجامعي<input name="universityEmail" type="email" required placeholder="202312345@anu.edu.jo" /></label>
      <div className="form-row">
        <label>العمر<input name="age" type="number" min="18" max="100" required /></label>
        <label>الدولة
          <select name="country" required>
            <option value="">اختر الدولة</option>
            <option>الأردن</option>
            <option>السعودية</option>
            <option>الإمارات</option>
            <option>مصر</option>
            <option>أخرى</option>
          </select>
        </label>
      </div>
      <label>ساعات العمل الأسبوعية
        <select name="hours">
          <option>1-2 ساعات</option>
          <option>3-4 ساعات</option>
          <option>5 ساعات أو أكثر</option>
        </select>
      </label>
      <label>مستوى الخبرة
        <select name="experience" required>
          <option value="">اختر مستوى الخبرة</option>
          <option>مبتدئ</option>
          <option>متوسط</option>
          <option>متقدم</option>
          <option>خبير</option>
        </select>
      </label>
      <label>لماذا تريد الانضمام؟<textarea name="whyJoin" rows="4" required placeholder="اكتب سبب رغبتك في الانضمام..." /></label>
      <div className="form-group">
        <span className="field-title">مهاراتك</span>
        <div className="skills-grid">
          {skills.map((skill) => (
            <label className="skill-checkbox" key={skill}><input type="checkbox" name="skills" value={skill} /> {skill}</label>
          ))}
        </div>
      </div>
      <label>كيف تعرفت علينا؟
        <select name="referral">
          <option>واتساب</option>
          <option>يوتيوب</option>
          <option>انستقرام</option>
          <option>صديق</option>
          <option>أخرى</option>
        </select>
      </label>
      <label className="checkbox-label"><input type="checkbox" required /> أقر بأنني قرأت وقبلت القوانين</label>
      <button className="submit-btn" type="submit"><Send size={18} /> إرسال الطلب</button>
    </form>
  );
}
