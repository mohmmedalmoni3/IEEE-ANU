"use client";

import { apiGet, apiPost } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function statusClass(status) {
  if (status === "مقبول") return "accepted";
  if (status === "مرفوض") return "rejected";
  if (status === "بحاجة لمقابلة" || status === "إعادة المقابلة") return "interview";
  return "pending";
}

export default function ProfileClient() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("ieee_user");
    if (saved) setUser(JSON.parse(saved));

    async function loadProfile() {
      try {
        const profile = await apiGet("/auth/me");
        localStorage.setItem("ieee_user", JSON.stringify(profile.user));
        setUser(profile.user);

        const applicationData = await apiGet("/applications/me");
        setApplications(applicationData.applications || []);
      } catch {
     const token = localStorage.getItem("ieee_anu_session_token");

if (!token) {
  localStorage.removeItem("ieee_user");
  setUser(null);
}

setApplications([]);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function logout() {
    await apiPost("/auth/logout");
   localStorage.removeItem("ieee_user");
localStorage.removeItem("ieee_anu_session_token");
router.push("/login");
  }

  if (loading && !user) {
    return (
      <section className="page-content narrow">
        <div className="info-card center"><h3>جاري تحميل الملف الشخصي...</h3></div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="page-content narrow">
        <div className="info-card center">
          <h3>لم يتم تسجيل الدخول</h3>
          <p>سجل الدخول لعرض ملفك الشخصي ونتيجة طلبك.</p>
          <Link className="apply-btn" href="/login">تسجيل الدخول</Link>
        </div>
      </section>
    );
  }

  const latestApplication = applications[0];

  return (
    <section className="page-content narrow">
      <div className="profile-card">
        <div className="avatar large">{(user.firstname || user.name || "IEEE").slice(0, 2)}</div>
        <h2>{user.firstname} {user.lastname}</h2>
        <p>{user.email}</p>
        <dl>
          <div><dt>اسم المستخدم</dt><dd>{user.username || "غير محدد"}</dd></div>
          <div><dt>معرف التواصل</dt><dd>{user.discord || "غير محدد"}</dd></div>
          <div><dt>الصلاحية</dt><dd>{user.role === "admin" ? "مدير" : "عضو"}</dd></div>
          <div><dt>تاريخ الانضمام</dt><dd>{user.joinDate ? new Date(user.joinDate).toLocaleDateString("ar-JO") : "اليوم"}</dd></div>
        </dl>

        <div className="application-status-card">
          <h3>حالة طلب الانضمام</h3>
          {latestApplication ? (
            <>
              <span className={`status-badge ${statusClass(latestApplication.status)}`}>{latestApplication.status}</span>
              <p>آخر تحديث: {new Date(latestApplication.updatedAt || latestApplication.createdAt).toLocaleDateString("ar-JO")}</p>
              <p>البريد المستخدم في الطلب: {latestApplication.universityEmail}</p>
              {latestApplication.adminNote && <p>ملاحظة الإدارة: {latestApplication.adminNote}</p>}
            </>
          ) : (
            <>
              <p>لا يوجد طلب مرتبط بحسابك حتى الآن.</p>
              <Link className="apply-btn" href="/applications">إرسال طلب انضمام</Link>
            </>
          )}
        </div>

        {user.role === "admin" && <Link className="apply-btn" href="/admin/applications">إدارة طلبات الانضمام</Link>}
        <button className="reset-btn" onClick={logout}>تسجيل الخروج</button>
      </div>
    </section>
  );
}
