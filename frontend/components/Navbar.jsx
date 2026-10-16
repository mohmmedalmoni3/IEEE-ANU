"use client";

import { apiGet } from "@/lib/api";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "الرئيسية" },
  { href: "/about", label: "من نحن" },
  { href: "/laws", label: "القوانين" },
  { href: "/creators", label: "صناع المحتوى" },
  { href: "/applications", label: "التقديمات" },
  { href: "/store", label: "المتجر" }
];

const adminLinks = [
  { href: "/admin/applications", label: "إدارة الطلبات" },
  { href: "/admin/users", label: "إدارة المستخدمين" },
  { href: "/admin/events", label: "إدارة الأحداث" },
  { href: "/admin/workshops", label: "إدارة الورش والتسجيل" },
  { href: "/admin/messages", label: "رسائل المستخدمين" },
  { href: "/admin/notifications", label: "التنبيهات" },
  { href: "/admin/activity", label: "سجل النشاط" },
  { href: "/admin/logins", label: "سجلات الدخول" },
  { href: "/admin/live-workshop", label: "الورشة المباشرة" },
  { href: "/admin/content", label: "إدارة المحتوى" }
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;
    const saved = localStorage.getItem("ieee_user");
    try {
      if (saved) setUser(JSON.parse(saved));
    } catch {
      localStorage.removeItem("ieee_user");
    }
    const loadUser = () => apiGet("/auth/me").then((data) => {
        if (!active) return;
        localStorage.setItem("ieee_user", JSON.stringify(data.user));
        setUser(data.user);
        if (data.user?.show404 && pathname !== "/not-found") router.replace("/not-found");
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem("ieee_user");
        setUser(null);
      });
    loadUser();
    window.addEventListener("ieee:session-change", loadUser);
    return () => {
      active = false;
      window.removeEventListener("ieee:session-change", loadUser);
    };
  }, [pathname, router]);

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link className="logo" href="/">
          <Image src="/IEEE.png" alt="IEEE ANU" width={54} height={54} sizes="54px" priority className="logo-img" />
          <div className="logo-text">
            <h2>IEEE ANU</h2>
            <span>Ajloun University</span>
          </div>
        </Link>

        <button className="icon-button menu-button" onClick={() => setOpen((value) => !value)} aria-label="القائمة">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

        <ul className={`nav-menu ${open ? "active" : ""}`}>
          {links.map((link) => (
            <li key={link.href}>
              <Link className={pathname === link.href ? "active" : ""} href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            </li>
          ))}
          {user?.role === "admin" && (
            <li className="admin-nav-group">
              <span className="admin-nav-label">Admin</span>
              <div className="admin-nav-links">
                {adminLinks.map((link) => (
                  <Link
                    key={link.href}
                    className={pathname === link.href ? "admin-link active" : "admin-link"}
                    href={link.href}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </li>
          )}
          <li>
            <Link className="login-btn" href={user ? "/profile" : "/login"} onClick={() => setOpen(false)}>
              {user ? "الملف الشخصي" : "تسجيل الدخول"}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
