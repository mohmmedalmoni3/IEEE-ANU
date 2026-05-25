import PageShell from "@/components/PageShell";
import ContentAdminClient from "./content-admin-client";

export const metadata = {
  title: "إدارة محتوى الموقع | IEEE ANU"
};

export default function AdminContentPage() {
  return (
    <PageShell>
      <section className="page-hero">
        <h1>إدارة محتوى الصفحة الرئيسية</h1>
        <p>تعديل الإحصائيات، صناع المحتوى، الفيديوهات، ومنتجات المتجر من لوحة الأدمن.</p>
      </section>
      <ContentAdminClient />
    </PageShell>
  );
}
