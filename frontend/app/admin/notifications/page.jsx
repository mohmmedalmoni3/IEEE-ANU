import PageShell from "@/components/PageShell";
import NotificationsAdminClient from "./notifications-admin-client";

export const metadata = {
  title: "تنبيهات الأدمن | IEEE ANU"
};

export default function AdminNotificationsPage() {
  return (
    <PageShell>
      <section className="page-hero">
        <h1>تنبيهات لوحة الأدمن</h1>
        <p>تنبيهات فورية عند تسجيل مستخدم جديد أو وصول طلب انضمام جديد.</p>
      </section>
      <NotificationsAdminClient />
    </PageShell>
  );
}
