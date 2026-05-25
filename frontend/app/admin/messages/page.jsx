import PageShell from "@/components/PageShell";
import MessagesAdminClient from "./messages-admin-client";

export const metadata = {
  title: "رسائل المستخدمين | IEEE ANU"
};

export default function AdminMessagesPage() {
  return (
    <PageShell>
      <section className="page-hero">
        <h1>رسائل وتنبيهات المستخدمين</h1>
        <p>إرسال رسائل بريدية للمستخدمين مع ملاحظات وروابط دعم فوري.</p>
      </section>
      <MessagesAdminClient />
    </PageShell>
  );
}
