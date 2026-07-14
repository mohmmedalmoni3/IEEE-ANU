import AuthGate from "@/components/AuthGate";
import PageShell from "@/components/PageShell";
import { apiGet } from "@/lib/api";
import { Package, Wrench } from "lucide-react";


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
        <p>نعمل على تجهيز المتجر بأفضل تجربة ممكنة للأعضاء.</p>
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
