import PageShell from "@/components/PageShell";
import ActivityAdminClient from "./activity-admin-client";

export const metadata = {
  title: "سجل نشاط الأدمن | IEEE ANU"
};

export default function AdminActivityPage() {
  return (
    <PageShell>
      <section className="page-hero">
        <h1>سجل نشاط الأدمن</h1>
        <p>متابعة تغييرات الصلاحيات، حذف الحسابات، تحديث الطلبات، وإرسال الرسائل.</p>
      </section>
      <ActivityAdminClient />
    </PageShell>
  );
}
