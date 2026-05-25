import PageShell from "@/components/PageShell";
import { BookOpen, Code2, Lightbulb, Network, Target, Users } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "من نحن"
};

const values = [
  {
    icon: Lightbulb,
    title: "تعلم عملي",
    text: "نركز على تحويل المعرفة التقنية إلى تطبيقات وتجارب واقعية يفهمها الطالب ويستطيع البناء عليها."
  },
  {
    icon: Users,
    title: "مجتمع داعم",
    text: "نؤمن أن أفضل تعلم يحدث داخل فريق يتبادل الخبرة، يساعد بعضه، ويحتفل بتطور أعضائه."
  },
  {
    icon: Network,
    title: "فرص وتواصل",
    text: "نفتح المجال للتواصل مع صناع محتوى، مهندسين، طلاب، ومهتمين بالتقنية داخل الجامعة وخارجها."
  }
];

const tracks = [
  "البرمجة وتطوير الويب",
  "الذكاء الاصطناعي والأدوات الحديثة",
  "صناعة المحتوى التقني",
  "التصميم والمونتاج",
  "إدارة الفعاليات والعمل الجماعي"
];

export default function AboutPage() {
  return (
    <PageShell>
      <section className="page-hero">
        <h1>من نحن</h1>
        <p>IEEE ANU هو مجتمع طلابي تقني في جامعة عجلون الوطنية يجمع التعلم، التطبيق، المحتوى، والعمل الجماعي.</p>
      </section>

      <section className="page-content about-page">
        <div className="about-intro">
          <div>
            <span className="section-badge inline">IEEE ANU Student Branch</span>
            <h2>نصنع بيئة يتعلم فيها الطالب التقنية بطريقة أقرب للواقع</h2>
            <p>
              نسعى إلى بناء مجتمع جامعي نشط يساعد الطلاب على اكتشاف المجالات التقنية، تطوير مهاراتهم،
              المشاركة في ورش ومبادرات، وصناعة أثر داخل الجامعة من خلال مشاريع وتجارب قابلة للتطبيق.
            </p>
          </div>
          <div className="about-highlight">
            <Target size={42} />
            <h3>هدفنا</h3>
            <p>أن يكون IEEE ANU نقطة بداية قوية لكل طالب يريد دخول عالم التقنية بثقة وخبرة عملية.</p>
          </div>
        </div>

        <div className="about-values-grid">
          {values.map((item) => {
            const Icon = item.icon;
            return (
              <article className="info-card" key={item.title}>
                <Icon size={34} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>

        <div className="about-split">
          <section className="info-card">
            <BookOpen size={34} />
            <h3>ماذا نقدم؟</h3>
            <p>
              نقدم ورشًا تقنية، لقاءات معرفية، محتوى تعليمي، فرص مشاركة في التنظيم، ومساحات لتجربة الأفكار
              وبناء مهارات العرض، التعاون، وحل المشكلات.
            </p>
          </section>

          <section className="info-card">
            <Code2 size={34} />
            <h3>مسارات نهتم بها</h3>
            <ul className="about-track-list">
              {tracks.map((track) => <li key={track}>{track}</li>)}
            </ul>
          </section>
        </div>

        <div className="become-creator about-cta">
          <div>
            <h3>هل تريد أن تكون جزءًا من الفريق؟</h3>
            <p>إذا كنت مهتمًا بالتقنية أو صناعة المحتوى أو التنظيم، يمكنك إرسال طلب الانضمام ومتابعة حالته من حسابك.</p>
          </div>
          <Link className="apply-btn" href="/applications">انضم الآن</Link>
        </div>
      </section>
    </PageShell>
  );
}
