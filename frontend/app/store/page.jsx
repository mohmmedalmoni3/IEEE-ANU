import AuthGate from "@/components/AuthGate";
import PageShell from "@/components/PageShell";
import { apiGet } from "@/lib/api";
import { ArrowUpLeft, Award, ExternalLink, Package, ShieldCheck, Users, Wrench } from "lucide-react";


export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";


export default async function StorePage() {
  let products = [];
  try {
    products = (await apiGet("/site")).products;
  } catch {}

  return (
    <PageShell>
      <section className="page-hero">
        <h1>متجر IEEE ANU</h1>
        <p>ابدأ بعضوية IEEE العالمية، واكتشف مزاياها من مصدرها الرسمي.</p>
      </section>
      <section className="membership-offer" aria-labelledby="membership-offer-title">
        <div className="membership-offer-card">
          <div className="membership-offer-copy">
            <span className="membership-offer-eyebrow"><Award size={17} /> عضوية IEEE العالمية</span>
            <h2 id="membership-offer-title">خطوتك التالية تبدأ من هنا</h2>
            <p className="membership-offer-description">
              ابدأ طلب عضوية IEEE الطلابية، وأكمل بياناتك وإجراءات الدفع مباشرةً عبر الموقع الرسمي لـ IEEE.
            </p>
            <div className="membership-offer-benefits">
              <span><Users size={18} /> مجتمع تقني عالمي</span>
              <span><ShieldCheck size={18} /> تسجيل آمن عبر IEEE</span>
            </div>
            <a
              className="btn btn-primary membership-offer-cta"
              href="https://www.ieee.org/membership-application/public/join.html?grade=Student"
              target="_blank"
              rel="noopener noreferrer"
            >
              اشترِ عضوية الطالب <ArrowUpLeft size={19} />
            </a>
            <p className="membership-offer-note">
              ستنتقل مباشرةً إلى نموذج الانضمام الطلابي الرسمي؛ وتظهر الرسوم النهائية أثناء التسجيل.
            </p>
          </div>
          <div className="membership-offer-emblem" aria-hidden="true">
            <Award size={76} strokeWidth={1.35} />
            <span>IEEE</span>
            <ExternalLink size={18} className="membership-offer-emblem-link" />
          </div>
        </div>
      </section>
      <section className="page-content">
        <AuthGate title="المتجر مخصص للأعضاء" message="سجل الدخول أو أنشئ حسابًا حتى تتمكن من مشاهدة خدمات ومنتجات المتجر.">
          <div className="maintenance-box">
            <Wrench size={70} />
            <h2>المتجر تحت الصيانة</h2>
            <p>سيتم إضافة خدمات ومزايا جديدة للأعضاء قريبًا.</p>
          </div>
          <div className="cards-grid">
            {products.map((product) => (
              <article className="info-card" key={product.name}><Package /><h3>{product.name}</h3><p>{product.status}</p><strong>{product.price}</strong></article>
            ))}
          </div>
        </AuthGate>
      </section>
    </PageShell>
  );
}
