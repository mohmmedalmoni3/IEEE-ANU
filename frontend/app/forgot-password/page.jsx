"use client";

import { apiPost } from "@/lib/api";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PageShell from "@/components/PageShell";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      await apiPost("/forgot-password", { email });
      setMessage("إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة تحتوي على رابط إعادة التعيين.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <section className="page-hero">
        <h1>نسيت كلمة المرور</h1>
        <p>أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.</p>
      </section>
      <section className="login-content">
        <div className="login-container">
          <div className="auth-form active">
            <div className="form-header">
              <Mail size={44} />
              <h2>إعادة تعيين كلمة المرور</h2>
              <p>أدخل بريدك الإلكتروني المسجل</p>
            </div>
            {message && <div className="notice">{message}</div>}
            <form onSubmit={handleSubmit}>
              <label>البريد الإلكتروني
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
              </button>
            </form>
            <div className="back-to-login">
              <a href="/login">العودة إلى تسجيل الدخول</a>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
