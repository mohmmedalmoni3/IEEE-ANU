"use client";

import { apiGet } from "@/lib/api";
import LiveWorkshopCard from "@/components/LiveWorkshopCard";
import StatCounter from "@/components/StatCounter";
import VideoCard from "@/components/VideoCard";
import { useEffect, useState } from "react";

export default function HomeContent() {
  const [data, setData] = useState({ stats: [], creators: [], videos: [], products: [], liveWorkshop: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/site")
      .then((responseData) => setData(responseData))
      .catch((error) => console.error("Failed to load site content:", error))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <section className="page-content"><div className="info-card center">جاري تحميل المحتوى...</div></section>;
  }

  return (
    <>
      {data.liveWorkshop && <LiveWorkshopCard workshop={data.liveWorkshop} />}

      {data.stats.length > 0 && (
        <section className="stats-section">
          <h2 className="section-title">إنجازاتنا بالأرقام</h2>
          <div className="stats-grid">
            {data.stats.map((stat, index) => (
              <StatCounter key={stat.id} value={stat.value} label={stat.label} index={index} />
            ))}
          </div>
        </section>
      )}

      {data.videos.length > 0 && (
        <section className="videos-section">
          <h2 className="section-title">أحدث الفيديوهات</h2>
          <div className="videos-grid">
            {data.videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {data.creators.length > 0 && (
        <section className="creators-section">
          <h2 className="section-title">صناع المحتوى</h2>
          <div className="creators-grid">
            {data.creators.map((creator) => (
              <a key={creator.id} href={creator.url} target="_blank" rel="noopener noreferrer" className="creator-card">
                <div className="creator-platform">{creator.platform}</div>
                <h3>{creator.name}</h3>
                <p>{creator.role}</p>
                {creator.followers && <span className="creator-followers">{creator.followers} متابع</span>}
              </a>
            ))}
          </div>
        </section>
      )}

      {data.products.length > 0 && (
        <section className="products-section">
          <h2 className="section-title">المتجر</h2>
          <div className="products-grid">
            {data.products.map((product) => (
              <article key={product.id} className="product-card">
                <h3>{product.name}</h3>
                <p className="product-price">{product.price}</p>
                <span className={`product-status ${product.status === "متوفر" ? "available" : "unavailable"}`}>
                  {product.status}
                </span>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}