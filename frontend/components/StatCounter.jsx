"use client";

import { useEffect, useRef, useState } from "react";

export default function StatCounter({ value, label, index }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      let current = 0;
      const step = Math.max(1, Math.ceil(value / 40));
      const timer = setInterval(() => {
        current = Math.min(value, current + step);
        setCount(current);
        if (current >= value) clearInterval(timer);
      }, 28);
      observer.disconnect();
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <article className="stat-card" ref={ref}>
      <div className="stat-number">{count}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-icon">{String(index + 1).padStart(2, "0")}</div>
    </article>
  );
}
