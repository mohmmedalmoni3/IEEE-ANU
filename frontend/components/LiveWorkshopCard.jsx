"use client";

import { apiGet } from "@/lib/api";
import { Radio, Video } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LiveWorkshopCard({ workshop }) {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    apiGet("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  if (!workshop || !workshop.isVisible) return null;

  async function joinWorkshop() {
    setMessage("");
    setJoining(true);
    try {
      const data = await apiGet("/live-workshop/join");
      window.location.href = data.workshop.meetUrl;
    } catch (error) {
      setMessage(error.message || "يجب تسجيل الدخول أولًا لدخول الورشة");
    } finally {
      setJoining(false);
    }
  }

  return (
    <section className="live-workshop-section">
      <div className={workshop.isLive ? "live-workshop-card live" : "live-workshop-card"}>
        <div className="live-workshop-status">
          <span className="live-dot" />
          <strong>{workshop.isLive ? "بث مباشر الآن" : "ورشة قادمة"}</strong>
        </div>

        <div className="live-workshop-content">
          <div className="live-workshop-icon"><Radio size={30} /></div>
          <div>
            <h2>{workshop.title}</h2>
            {workshop.description && <p>{workshop.description}</p>}
            <div className="live-workshop-meta">
              {workshop.speaker && <span>المتحدث: {workshop.speaker}</span>}
              {workshop.startsAt && <span>الموعد: {workshop.startsAt}</span>}
            </div>
          </div>
        </div>

        <div className="live-workshop-actions">
          {user ? (
            <button className="submit-btn live-join-btn" type="button" onClick={joinWorkshop} disabled={joining || !workshop.isLive}>
              <Video size={18} />
              {joining ? "جاري التحويل..." : workshop.isLive ? "دخول الورشة الآن" : "تفتح عند بدء الورشة"}
            </button>
          ) : (
            <Link className="submit-btn live-join-btn" href="/login">
              <Video size={18} />
              سجل الدخول لدخول الورشة
            </Link>
          )}
        </div>

        {message && <div className="notice admin-notice">{message}</div>}
      </div>
    </section>
  );
}
