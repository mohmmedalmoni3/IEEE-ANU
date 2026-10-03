"use client";

import { AlertCircle, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-content">
          <AlertCircle size={120} className="not-found-icon" />
          <h1 className="not-found-title">404</h1>
          <h2 className="not-found-subtitle">الصفحة غير موجودة</h2>
          <p className="not-found-description">
            عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
          </p>
          <p className="not-found-support-message">
            إذا تم تقييد الوصول إلى حسابك أو كنت تعتقد أن هذا خطأ، يرجى التواصل مع الدعم الفني للمساعدة.
          </p>
          <a className="not-found-support-link" href="mailto:support@ieeeanu.com">
            التواصل مع الدعم الفني
          </a>
          <Link href="/" className="not-found-button">
            <Home size={20} />
            <span>العودة للرئيسية</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
