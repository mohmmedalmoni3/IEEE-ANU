import PageShell from "@/components/PageShell";
import { AlertTriangle, Ban, Clock, Gavel, ShieldCheck } from "lucide-react";

const laws = [
  ["مهتم بالتكنولوجيا", "أن يكون المتقدم مهتما بالتكنولوجيا أو البرمجة أو الهندسة أو الابتكار التقني."],
  ["الأخلاق المهنية", "الالتزام بالاحترام والتعاون مع جميع أعضاء الفريق والمجتمع."],
  ["الالتزام بالحضور", "حضور الاجتماعات والفعاليات الرسمية قدر الإمكان والمشاركة بفاعلية."],
  ["حماية سمعة المجتمع", "يحق للإدارة إيقاف أو إنهاء العضوية عند مخالفة القوانين أو الإضرار بسمعة المجتمع."]
];

export default function LawsPage() {
  return (
    <PageShell>
      <section className="page-hero">
        <h1>قوانين IEEE ANU</h1>
        <p>القوانين واللوائح التنظيمية للمجتمع.</p>
      </section>
      <section className="page-content">
        <div className="law-category">
          <div className="category-header"><Gavel /><h2>القوانين العامة</h2></div>
          <div className="law-list">
            {laws.map(([title, text], index) => (
              <article className="law-item" key={title}>
                <div className="law-number">{String(index + 1).padStart(2, "0")}</div>
                <div className="law-text"><h3>{title}</h3><p>{text}</p></div>
              </article>
            ))}
          </div>
        </div>
        <div className="cards-grid">
          <article className="info-card"><AlertTriangle /><h3>تحذير كتابي</h3><p>للمخالفة الأولى البسيطة أو الخطأ غير المتعمد.</p></article>
          <article className="info-card"><Clock /><h3>إيقاف مؤقت</h3><p>للمخالفات المتكررة أو عدم الالتزام بالتوجيهات.</p></article>
          <article className="info-card"><Ban /><h3>إيقاف دائم</h3><p>للمخالفات الكبيرة أو انتحال الشخصية أو إثارة المشاكل.</p></article>
          <article className="info-card"><ShieldCheck /><h3>إنهاء العضوية</h3><p>عند الإضرار بسمعة المجتمع أو مخالفة القوانين الأساسية.</p></article>
        </div>
      </section>
    </PageShell>
  );
}
