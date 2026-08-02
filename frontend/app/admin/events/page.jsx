import PageShell from "@/components/PageShell";
import EventsAdminClient from "./events-admin-client";

export const metadata = {
  title: "إدارة الأحداث | IEEE ANU"
};

export default function AdminEventsPage() {
  return (
    <PageShell>
      <section className="page-hero">
        <h1>إدارة الأحداث</h1>
        <p>إضافة وتعديل وحذف الأحداث مع العدادات التنازلية.</p>
      </section>
      <EventsAdminClient />
    </PageShell>
  );
}
