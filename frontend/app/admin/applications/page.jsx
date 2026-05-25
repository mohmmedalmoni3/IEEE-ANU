import PageShell from "@/components/PageShell";
import ApplicationsAdminClient from "./applications-admin-client";

export const metadata = {
  title: "إدارة الطلبات | IEEE ANU"
};

export default function AdminApplicationsPage() {
  return (
    <PageShell>
      <section className="page-hero">
        <h1>إدارة طلبات الانضمام</h1>
        <p>مراجعة الطلبات وتحديث حالتها من حساب المدير فقط.</p>
      </section>
      <ApplicationsAdminClient />
    </PageShell>
  );
}
