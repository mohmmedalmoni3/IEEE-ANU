"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowLeft } from "lucide-react";
import { apiPost } from "@/lib/api";
import PageShell from "@/components/PageShell";
import Link from "next/link";

export default function VerifyOTPPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!email || !otp) {
      setMessage("الرجاء إدخال البريد الإلكتروني ورمز التحقق");
      return;
    }

    setLoading(true);

    try {
      const data = await apiPost("/verify-otp", { email, otp });
      // Store userId in sessionStorage for password reset
      sessionStorage.setItem("resetUserId", data.userId);
      sessionStorage.setItem("resetEmail", email);
      router.push("/reset-password");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell>
      <section className="page-hero">
        <h1>التحقق من الرمز</h1>
        <p>أدخل رمز التحقق المرسل إلى بريدك الإلكتروني</p>
      </section>
      <section className="login-content">
        <div className="login-container">
          <div className="auth-form active">
            <div className="form-header">
              <Shield size={44} />
              <h2>رمز التحقق</h2>
              <p>أدخل الرمز المكون من 6 أرقام</p>
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
              <label>رمز التحقق
                <input
                  name="otp"
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{ letterSpacing: "8px", textAlign: "center", fontSize: "24px" }}
                />
              </label>
              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? "جاري التحقق..." : "تحقق من الرمز"}
              </button>
            </form>
            <div className="back-to-login">
              <Link href="/forgot-password">
                <ArrowLeft size={16} />
                العودة لطلب رمز جديد
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
