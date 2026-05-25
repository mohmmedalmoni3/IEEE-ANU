import PageShell from "@/components/PageShell";
import LoginsAdminClient from "./logins-admin-client";

export const metadata = {
  title: "سجلات الدخول | IEEE ANU"
};

export default function AdminLoginsPage() {
  return (
    <PageShell>
      <section className="page-hero">
        <h1>سجلات الدخول</h1>
        <p>عرض الجهاز، عنوان IP، المتصفح، نظام التشغيل، ووقت دخول المستخدمين.</p>
      </section>
      <LoginsAdminClient />
    </PageShell>
  );
}
