"use client";

import { apiPost } from "@/lib/api";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function AuthForms() {
  const router = useRouter();
  const [tab, setTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    // The profile contains no server-rendered personal data; load its code
    // while the visitor fills in the form, before a session cookie is set.
    router.prefetch("/profile");
  }, [router]);

  async function submit(event, mode) {
    event.preventDefault();
    if (submitting.current) return;
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form);
    if (mode === "register" && payload.password !== payload.confirmPassword) {
      setMessage("كلمة المرور غير متطابقة");
      return;
    }
    if (mode === "register" && !(payload.password.length >= 10 && /[a-z]/.test(payload.password) && /[A-Z]/.test(payload.password) && /\d/.test(payload.password) && /[^A-Za-z0-9]/.test(payload.password))) {
      setMessage("كلمة المرور يجب أن تكون 10 أحرف على الأقل وتحتوي على حرف كبير وحرف صغير ورقم ورمز");
      return;
    }
    submitting.current = true;
    setPending(true);
    try {
      const data = await apiPost(`/auth/${mode}`, payload);
      if (!data.token || !data.user) throw new Error("لم يتم استلام بيانات الحساب من الخادم");
      localStorage.setItem("ieee_anu_session_token", data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("ieee_user", JSON.stringify(data.user));
      router.replace(data.user.show404 ? "/not-found" : "/profile");
    } catch (error) {
      setMessage(error.message);
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <section className="login-content">
      <div className="login-container">
        <div className="auth-tabs">
          <button disabled={pending} className={tab === "login" ? "tab-btn active" : "tab-btn"} onClick={() => setTab("login")}>تسجيل الدخول</button>
          <button disabled={pending} className={tab === "register" ? "tab-btn active" : "tab-btn"} onClick={() => setTab("register")}>إنشاء حساب</button>
        </div>

        {message && <div className="notice error">{message}</div>}

        {tab === "login" ? (
          <form className="auth-form active" onSubmit={(event) => submit(event, "login")} aria-busy={pending}>
            <div className="form-header">
              <LogIn size={44} />
              <h2>تسجيل الدخول إلى حسابك</h2>
              <p>استخدم البريد الإلكتروني أو اسم المستخدم.</p>
            </div>
            <label>البريد أو اسم المستخدم<input name="email" type="text" required placeholder="example@email.com" /></label>
            <label>كلمة المرور
              <div className="password-wrapper">
                <input name="password" type={showPassword ? "text" : "password"} required placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff /> : <Eye />}</button>
              </div>
            </label>
            <button className="submit-btn" type="submit" disabled={pending}>{pending ? "جاري فتح حسابك..." : "دخول"}</button>
            <div className="forgot-password-link">
              <a href="/forgot-password">نسيت كلمة المرور؟</a>
            </div>
          </form>
        ) : (
          <form className="auth-form active" onSubmit={(event) => submit(event, "register")} aria-busy={pending}>
            <div className="form-header">
              <UserPlus size={44} />
              <h2>إنشاء حساب جديد</h2>
              <p>انضم إلى مجتمع IEEE ANU.</p>
            </div>
            <div className="form-row">
              <label>الاسم الأول<input name="firstname" required placeholder="أحمد" /></label>
              <label>الاسم الأخير<input name="lastname" required placeholder="محمد" /></label>
            </div>
            <label>اسم المستخدم<input name="username" required placeholder="Ahmed_123" /></label>
            <label>البريد الإلكتروني<input name="email" type="email" required placeholder="example@email.com" /></label>
            <label>معرف التواصل<input name="discord" placeholder="رقم الهاتف" /></label>
            <div className="form-row">
              <label>كلمة المرور<input name="password" type="password" minLength={10} required /></label>
              <label>تأكيد كلمة المرور<input name="confirmPassword" type="password" minLength={10} required /></label>
            </div>
            <button className="submit-btn" type="submit" disabled={pending}>{pending ? "جاري إنشاء حسابك..." : "إنشاء الحساب"}</button>
          </form>
        )}
      </div>
    </section>
  );
}
