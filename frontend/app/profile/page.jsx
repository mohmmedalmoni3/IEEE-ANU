import PageShell from "@/components/PageShell";
import ProfileClient from "./profile-client";

export default function ProfilePage() {
  return (
    <PageShell>
      <section className="page-hero"><h1>الملف الشخصي</h1><p>بيانات حسابك في IEEE ANU.</p></section>
      <ProfileClient />
    </PageShell>
  );
}
