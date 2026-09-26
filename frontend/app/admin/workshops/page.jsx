import PageShell from "@/components/PageShell";
import WorkshopsAdminClient from "./workshops-admin-client";

export const metadata = {
  title: "إدارة الورش | IEEE ANU"
};

export default function AdminWorkshopsPage() {
  return (
    <PageShell>
      <section className="page-hero">
        <h1>إدارة الورش والتسجيل</h1>
        <p>أنشئ الورش، خصص نموذج التسجيل، حدد المواعيد والسعة، وتابع المسجلين.</p>
      </section>
      <WorkshopsAdminClient />
    </PageShell>
  );
}
