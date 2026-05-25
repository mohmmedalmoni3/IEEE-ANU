"use client";

import { apiGet } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AuthGate({
  children,
  title = "هذه الصفحة للأعضاء فقط",
  message = "سجل الدخول أو أنشئ حسابا للوصول إلى هذه الصفحة."
}) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    apiGet("/auth/me")
      .then((data) => {
        localStorage.setItem("ieee_user", JSON.stringify(data.user));
        setStatus("authenticated");
      })
      .catch(() => {
        localStorage.removeItem("ieee_user");
        setStatus("guest");
      });
  }, []);

  if (status === "loading") {
    return <div className="info-card center"><h3>جاري التحقق من الحساب...</h3></div>;
  }

  if (status === "guest") {
    return (
      <div className="info-card center auth-required-card">
        <h3>{title}</h3>
        <p>{message}</p>
        <Link className="apply-btn" href="/login">تسجيل الدخول أو إنشاء حساب</Link>
      </div>
    );
  }

  return children;
}
