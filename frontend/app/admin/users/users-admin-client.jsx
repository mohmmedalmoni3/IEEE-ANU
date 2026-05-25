"use client";

import { apiDelete, apiGet, apiPatch } from "@/lib/api";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function roleLabel(role) {
  return role === "admin" ? "مدير" : "عضو";
}

function roleClass(role) {
  return role === "admin" ? "accepted" : "pending";
}

export default function UsersAdminClient() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    apiGet("/users")
      .then((data) => setUsers(data.users || []))
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const searchable = [
        user.firstname,
        user.lastname,
        user.username,
        user.email,
        user.discord,
        user.role
      ].join(" ").toLowerCase();

      return matchesRole && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [users, query, roleFilter]);

  const counts = useMemo(() => {
    return {
      all: users.length,
      admin: users.filter((user) => user.role === "admin").length,
      member: users.filter((user) => user.role !== "admin").length
    };
  }, [users]);

  async function updateRole(id, role) {
    setMessage("");
    try {
      const data = await apiPatch(`/users/${id}/role`, { role });
      setUsers((items) => items.map((item) => (item.id === id ? data.user : item)));
      setMessage("تم تحديث صلاحية المستخدم بنجاح.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function deleteUser(user) {
    const ok = window.confirm(`هل أنت متأكد من حذف حساب ${user.firstname} ${user.lastname}؟`);
    if (!ok) return;

    setMessage("");
    try {
      await apiDelete(`/users/${user.id}`);
      setUsers((items) => items.filter((item) => item.id !== user.id));
      setMessage("تم حذف المستخدم بنجاح.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (loading) {
    return (
      <section className="page-content">
        <div className="info-card center">جاري تحميل المستخدمين...</div>
      </section>
    );
  }

  if (message && !users.length) {
    return (
      <section className="page-content narrow">
        <div className="info-card center">
          <h3>{message}</h3>
          <p>تأكد من تسجيل الدخول بحساب مدير.</p>
          <Link className="apply-btn" href="/login">تسجيل الدخول</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page-content">
      <div className="admin-toolbar">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="بحث بالاسم، البريد، اسم المستخدم..."
          aria-label="بحث في المستخدمين"
        />
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} aria-label="فلترة حسب الصلاحية">
          <option value="all">كل الصلاحيات</option>
          <option value="admin">مدير</option>
          <option value="member">عضو</option>
        </select>
        <Link className="btn btn-secondary admin-toolbar-link" href="/admin/applications">إدارة الطلبات</Link>
      </div>

      {message && <div className="notice admin-notice">{message}</div>}

      <div className="admin-summary">
        <span className="admin-metric total">إجمالي المستخدمين <strong>{counts.all}</strong></span>
        <span className="admin-metric accepted">المديرون <strong>{counts.admin}</strong></span>
        <span className="admin-metric pending">الأعضاء <strong>{counts.member}</strong></span>
        <span className="admin-metric visible">المعروض الآن <strong>{filteredUsers.length}</strong></span>
      </div>

      <div className="admin-users-list">
        {filteredUsers.map((user) => (
          <article className="admin-user-card" key={user.id}>
            <div className="admin-user-avatar">{`${user.firstname?.[0] || ""}${user.lastname?.[0] || ""}`}</div>
            <div className="admin-user-main">
              <h3>{user.firstname} {user.lastname}</h3>
              <p>{user.email}</p>
              <span>@{user.username}</span>
            </div>
            <div className="admin-user-meta">
              <span className={`status-badge ${roleClass(user.role)}`}>{roleLabel(user.role)}</span>
              <small>{user.applicationsCount || 0} طلب</small>
            </div>
            <div className="admin-user-date">
              <strong>تاريخ التسجيل</strong>
              <span>{new Date(user.createdAt).toLocaleDateString("ar-JO")}</span>
            </div>
            <div className="admin-user-actions">
              <button
                className="status-action accepted"
                type="button"
                disabled={user.role === "admin"}
                onClick={() => updateRole(user.id, "admin")}
              >
                جعله مدير
              </button>
              <button
                className="status-action pending"
                type="button"
                disabled={user.role !== "admin"}
                onClick={() => updateRole(user.id, "member")}
              >
                جعله عضو
              </button>
              <button className="status-action delete" type="button" onClick={() => deleteUser(user)}>
                حذف
              </button>
            </div>
          </article>
        ))}
      </div>

      {!filteredUsers.length && <div className="info-card center">لا يوجد مستخدمون مطابقون للبحث الحالي.</div>}
    </section>
  );
}
