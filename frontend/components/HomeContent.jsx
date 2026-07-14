import HomeContent from "@/components/HomeContent";
import PageShell from "@/components/PageShell";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function HomePage() {
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

      <HomeContent />
    </PageShell>
  );
}