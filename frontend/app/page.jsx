import LiveWorkshopCard from "@/components/LiveWorkshopCard";
import PageShell from "@/components/PageShell";
import StatCounter from "@/components/StatCounter";
import VideoCard from "@/components/VideoCard";
import { apiGet } from "@/lib/api";
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

export default async function HomePage() {
  let site = fallback;
  try {
    site = await apiGet("/site");
  } catch {}

  return (
    <PageShell>
      <section className="hero">
        <div className="hero-bg-grid" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <h1 className="city-title">IEEE<br />ANU</h1>
          <p className="hero-subtitle">تجربة تقنية عملية تجمع التعلم، الورش، المحتوى، والعمل الجماعي.</p>
          <div className="hero-buttons">
            <Link href="/applications" className="btn btn-primary">انضم الآن</Link>
            <a href="https://www.instagram.com/ieee_anu/" target="_blank" className="btn btn-secondary">إنستقرام</a>
          </div>
        </div>
      </section>

      <LiveWorkshopCard workshop={site.liveWorkshop} />

      <section className="stats">
        <div className="stats-container">
          {site.stats.map((stat, index) => <StatCounter key={stat.label} {...stat} index={index} />)}
        </div>
      </section>

      <div className="decorative-bar"><div className="decorative-text">IEEE ANU • IEEE ANU • IEEE ANU</div></div>

      <section className="content-creators">
        <div className="section-header">
          <h2>أحدث الفيديوهات</h2>
          <p>من قناة IEEE ANU الرسمية</p>
        </div>
        <div className="youtube-grid">
          {site.videos.map((video) => <VideoCard key={video.youtubeId} video={video} />)}
        </div>
        <div className="view-all">
          <a className="btn-view-all" href="https://www.youtube.com/@IEEEANUStudentBranch" target="_blank">قناة يوتيوب الرسمية</a>
        </div>
      </section>
    </PageShell>
  );
}
