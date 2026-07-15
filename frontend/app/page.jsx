import LiveWorkshopCard from "@/components/LiveWorkshopCard";
import PageShell from "@/components/PageShell";
import StatCounter from "@/components/StatCounter";
import VideoCard from "@/components/VideoCard";
import { apiGet } from "@/lib/api";
import { ArrowLeft, BookOpen, CalendarCheck, Code2, GraduationCap, HelpCircle, Radio, ShieldCheck, Sparkles, Users, Workflow } from "lucide-react";
import Link from "next/link";

const fallback = {
  stats: [
    { label: "المشتركون الآن", value: 50 },
    { label: "أعضاء الفريق", value: 20 },
    { label: "المهندسون المعتمدون", value: 8 },
    { label: "إجمالي الزيارات", value: 250 }
  ],
  videos: [],
  liveWorkshop: null
};

const tracks = [
  {
    icon: Code2,
    title: "مسارات تقنية عملية",
    text: "ورش قصيرة ومشاريع تطبيقية في البرمجة، الذكاء الاصطناعي، الإلكترونيات، وتصميم المنتجات."
  },
  {
    icon: Users,
    title: "مجتمع يعمل كفريق",
    text: "توزيع أدوار واضح بين المحتوى، التنظيم، التصميم، والتطوير حتى يشعر كل عضو أنه يضيف قيمة."
  },
  {
    icon: ShieldCheck,
    title: "تجربة منظمة وآمنة",
    text: "حسابات مستخدمين، طلبات انضمام، متابعة حالة الطلب، ومساعد عام يشرح للزائر الخطوات الأساسية."
  }
];

const programs = [
  {
    icon: GraduationCap,
    title: "Workshops",
    text: "ورش عملية قصيرة تربط الطالب بأدوات ومهارات يستخدمها في مشاريع حقيقية."
  },
  {
    icon: BookOpen,
    title: "Content Lab",
    text: "مساحة لصناعة محتوى تقني واضح ومنظم، من الأفكار وحتى النشر والمتابعة."
  },
  {
    icon: Workflow,
    title: "Community Ops",
    text: "تنظيم الطلبات، المتابعة، الفعاليات، والتواصل بحيث يعمل الفريق بطريقة احترافية."
  }
];

const journey = [
  "أنشئ حسابك في الموقع",
  "اقرأ القوانين قبل التقديم",
  "قدّم طلب الانضمام",
  "تابع حالة طلبك من الملف الشخصي",
  "شارك في الورش والفعاليات المباشرة"
];

export default async function HomePage() {
  let site = fallback;
  try {
    site = await apiGet("/site");
  } catch {}

  const videos = site.videos || [];

  return (
    <PageShell>
      <section className="hero premium-hero">
        <div className="hero-bg-grid" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="city-title">IEEE<br />ANU</h1>
          <p className="hero-subtitle">
            منصة طلابية تقنية تجمع الورش المباشرة، المحتوى التعليمي، طلبات الانضمام، ومتابعة تجربة العضو في مكان واحد.
          </p>
          <div className="hero-buttons">
            <Link href="/applications" className="btn btn-primary">
              انضم الآن <ArrowLeft size={18} />
            </Link>
            <a href="https://www.instagram.com/ieee_anu/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">إنستقرام</a>
          </div>
        </div>
      </section>

      <LiveWorkshopCard workshop={site.liveWorkshop} />

      <section className="stats">
        <div className="stats-container">
          {(site.stats || fallback.stats).map((stat, index) => <StatCounter key={stat.label} {...stat} index={index} />)}
        </div>
      </section>

      <section className="premium-section">
        <div className="section-header">
          <h2>تجربة IEEE ANU الجديدة</h2>
          <p>الموقع لم يعد صفحة تعريفية فقط، بل تجربة منظمة تربط الطالب بالفريق والورش والمحتوى.</p>
        </div>
        <div className="premium-feature-grid">
          {tracks.map((track) => {
            const Icon = track.icon;
            return (
              <article className="premium-feature-card" key={track.title}>
                <Icon size={30} />
                <h3>{track.title}</h3>
                <p>{track.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="programs-section">
        <div className="section-header">
          <h2>برامج ومسارات الفريق</h2>
          <p>هيكلة واضحة تجعل الزائر يفهم أين يمكن أن يشارك وكيف يمكن أن يتطور داخل المجتمع.</p>
        </div>
        <div className="programs-grid">
          {programs.map((program) => {
            const Icon = program.icon;
            return (
              <article className="program-card" key={program.title}>
                <Icon size={28} />
                <h3>{program.title}</h3>
                <p>{program.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="journey-section">
        <div>
          <span className="section-badge inline">مسار واضح</span>
          <h2>من زائر إلى عضو فعّال</h2>
          <p>كل خطوة في تجربة الطالب أصبحت قابلة للمتابعة من الموقع، من التسجيل وحتى حضور الورش.</p>
        </div>
        <ol className="journey-list">
          {journey.map((item, index) => (
            <li key={item}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item}
            </li>
          ))}
        </ol>
      </section>

      <section className="home-help-band">
        <div>
          <HelpCircle size={34} />
          <h2>تحتاج توجيهًا سريعًا؟</h2>
          <p>مركز المساعدة يشرح التسجيل، التقديم، الورش، الملف الشخصي، والتواصل بطريقة مختصرة وواضحة.</p>
        </div>
        <Link className="btn btn-primary" href="/help">فتح مركز المساعدة</Link>
      </section>

      <div className="decorative-bar"><div className="decorative-text">IEEE ANU • IEEE ANU • IEEE ANU • IEEE ANU</div></div>

      <section className="content-creators">
        <div className="section-header">
          <h2>أحدث الفيديوهات</h2>
          <p>مختارات من قناة IEEE ANU الرسمية</p>
        </div>
        <div className="youtube-grid">
          {videos.length ? videos.map((video) => <VideoCard key={video.youtubeId} video={video} />) : (
            <article className="info-card center">
              <h3>لا توجد فيديوهات مضافة بعد</h3>
              <p>سيتم عرض فيديوهات IEEE ANU هنا عند توفرها.</p>
            </article>
          )}
        </div>
        <div className="view-all">
          <a className="btn-view-all" href="https://www.youtube.com/@IEEEANUStudentBranch" target="_blank" rel="noreferrer">
            قناة يوتيوب الرسمية
          </a>
        </div>
      </section>
    </PageShell>
  );
}