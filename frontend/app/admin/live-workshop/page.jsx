import PageShell from "@/components/PageShell";
import LiveWorkshopAdminClient from "./live-workshop-admin-client";

export const metadata = {
  title: "إدارة الورشة المباشرة | IEEE ANU"
};

export default function AdminLiveWorkshopPage() {
  return (
    <PageShell>
      <section className="page-hero">
        <h1>إدارة الورشة المباشرة</h1>
        <p>تفعيل ورشة Google Meet على الصفحة الرئيسية والتحكم في الرابط والمعلومات.</p>
      </section>
      <LiveWorkshopAdminClient />
    </PageShell>
  );
}
