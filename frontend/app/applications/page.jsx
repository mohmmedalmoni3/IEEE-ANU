import ApplicationForm from "@/components/ApplicationForm";
import AuthGate from "@/components/AuthGate";
import PageShell from "@/components/PageShell";
import { Info } from "lucide-react";

export default function ApplicationsPage() {
  return (
    <PageShell>
      <section className="page-hero">
        <h1>نموذج التقديم</h1>
        <p>انضم إلى عائلة IEEE ANU.</p>
      </section>
      <section className="page-content narrow">
        <AuthGate title="التقديم يتطلب حسابًا" message="أنشئ حسابًا أو سجل الدخول حتى تتمكن من إرسال طلب ومتابعة حالته لاحقًا.">
          <div className="info-box">
            <Info />
            <div>
              <h3>معلومات مهمة قبل التقديم</h3>
              <ul>
                <li>يفضل أن يكون لديك اهتمام واضح بالتكنولوجيا أو البرمجة.</li>
                <li>سيتم مراجعة الطلب خلال 24-48 ساعة.</li>
                <li>الالتزام بالقوانين واحترام الفريق شرط أساسي.</li>
              </ul>
            </div>
          </div>
          <ApplicationForm />
        </AuthGate>
      </section>
    </PageShell>
  );
}
