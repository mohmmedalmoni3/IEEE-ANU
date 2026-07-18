"use client";

import { apiPost } from "@/lib/api";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthForms() {
  const router = useRouter();
  const [tab, setTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  async function login(event) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
   const data = await apiPost("/auth/login", Object.fromEntries(form));

if (!data.token) {
  throw new Error("لم يتم استلام رمز تسجيل الدخول من الخادم");
}

localStorage.setItem("ieee_anu_session_token", data.token);
localStorage.setItem("token", data.token);
localStorage.setItem("ieee_user", JSON.stringify(data.user));
router.push("/profile");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function register(event) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form);
    if (payload.password !== payload.confirmPassword) {
      setMessage("كلمة المرور غير متطابقة");
      return;
    }
    try {
      const data = await apiPost("/auth/register", payload);
localStorage.setItem("ieee_anu_session_token", data.token);
localStorage.setItem("token", data.token);
localStorage.setItem("ieee_user", JSON.stringify(data.user));
router.push("/profile");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="login-content">
      <div className="login-container">
        <div className="auth-tabs">
          <button className={tab === "login" ? "tab-btn active" : "tab-btn"} onClick={() => setTab("login")}>تسجيل الدخول</button>
          <button className={tab === "register" ? "tab-btn active" : "tab-btn"} onClick={() => setTab("register")}>إنشاء حساب</button>
        </div>

        {message && <div className="notice error">{message}</div>}

        {tab === "login" ? (
          <form className="auth-form active" onSubmit={login}>
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
            <button className="submit-btn" type="submit">دخول</button>
            <div className="forgot-password-link">
              <a href="/forgot-password">نسيت كلمة المرور؟</a>
            </div>
          </form>
        ) : (
          <form className="auth-form active" onSubmit={register}>
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
              <label>كلمة المرور<input name="password" type="password" minLength={8} required /></label>
              <label>تأكيد كلمة المرور<input name="confirmPassword" type="password" minLength={8} required /></label>
            </div>
            <button className="submit-btn" type="submit">إنشاء الحساب</button>
          </form>
        )}
      </div>
    </section>
  );
}
