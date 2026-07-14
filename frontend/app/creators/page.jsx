import PageShell from "@/components/PageShell";
import { apiGet } from "@/lib/api";
import { Crown, ExternalLink, Star, Users } from "lucide-react";
import Link from "next/link";


export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";



export default async function CreatorsPage() {
  let creators = [];
  try {
    creators = (await apiGet("/site")).creators;
  } catch {}

  return (
    <PageShell>
      <section className="page-hero"><h1>صناع المحتوى</h1><p>المهندسون الذين يثرون تجربة IEEE ANU.</p></section>
      <section className="page-content">
        <div className="section-badge"><Crown /> المميزون</div>
        <div className="cards-grid">
          {creators.map((creator) => (
            <article className="featured-card" key={creator.name}>
              <div className="avatar">{creator.name.slice(0, 2)}</div>
              <h3>{creator.name}</h3>
              <p>{creator.role}</p>
              <strong>{creator.followers}</strong>
            </article>
          ))}
        </div>
        <div className="section-badge"><Users /> جميع صناع المحتوى</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>الاسم</th><th>المنصة</th><th>المتابعون</th><th>الرابط</th></tr></thead>
            <tbody>
              {creators.map((creator, index) => (
                <tr key={creator.name}>
                  <td>{String(index + 1).padStart(2, "0")}</td>
                  <td>{creator.name}</td>
                  <td>{creator.platform}</td>
                  <td>{creator.followers}</td>
                  <td><a className="follow-btn" href={creator.url} target="_blank">متابعة <ExternalLink size={14} /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="become-creator">
          <div><Star /><h3>هل تريد أن تصبح صانع محتوى مدعوما؟</h3><p>نبحث دائما عن مبدعين جدد يقدمون محتوى تقني مفيد للطلاب.</p></div>
          <Link className="apply-btn" href="/applications">تقديم طلب</Link>
        </div>
      </section>
    </PageShell>
  );
}
