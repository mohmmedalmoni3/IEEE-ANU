import PageShell from "@/components/PageShell";
import UsersAdminClient from "./users-admin-client";

export const metadata = {
  title: "إدارة المستخدمين | IEEE ANU"
};

export default function AdminUsersPage() {
  return (
    <PageShell>
      <section className="page-hero">
        <h1>إدارة المستخدمين</h1>
        <p>عرض الحسابات المسجلة وتعديل صلاحيات المدير أو حذف الحسابات عند الحاجة.</p>
      </section>
      <UsersAdminClient />
    </PageShell>
  );
}
