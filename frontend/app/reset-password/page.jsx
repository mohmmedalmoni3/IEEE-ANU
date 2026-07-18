"use client";

import { apiPost } from "@/lib/api";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import PageShell from "@/components/PageShell";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!token) {
      setMessage("رمز إعادة التعيين مفقود. يرجى طلب رابط جديد من صفحة نسيت كلمة المرور.");
      return;
    }

    if (password.length < 8) {
      setMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("كلمة المرور وتأكيدها غير متطابقين");
      return;
    }

    setLoading(true);

    try {
      await apiPost("/reset-password", { token, password, confirmPassword });
      setMessage("تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <section className="page-hero">
        <h1>إعادة تعيين كلمة المرور</h1>
        <p>أدخل كلمة المرور الجديدة لحسابك</p>
      </section>
      <section className="login-content">
        <div className="login-container">
          <div className="auth-form active">
            <div className="form-header">
              <Lock size={44} />
              <h2>كلمة المرور الجديدة</h2>
              <p>أنشئ كلمة مرور قوية وآمنة</p>
            </div>
            {message && <div className="notice">{message}</div>}
            <form onSubmit={handleSubmit}>
              <label>كلمة المرور الجديدة
                <div className="password-wrapper">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    minLength={8}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </label>
              <label>تأكيد كلمة المرور
                <div className="password-wrapper">
                  <input
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    minLength={8}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </label>
              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? "جاري التحديث..." : "تحديث كلمة المرور"}
              </button>
            </form>
            <div className="back-to-login">
              <a href="/forgot-password">طلب رابط جديد</a>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
