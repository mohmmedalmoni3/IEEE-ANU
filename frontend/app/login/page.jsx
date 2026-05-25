import AuthForms from "@/components/AuthForms";
import PageShell from "@/components/PageShell";

export default function LoginPage() {
  return (
    <PageShell>
      <section className="page-hero"><h1>مرحبا بك في IEEE ANU</h1><p>سجل دخولك للوصول إلى حسابك وملفك الشخصي.</p></section>
      <AuthForms />
    </PageShell>
  );
}
