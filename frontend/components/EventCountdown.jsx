"use client";

import { apiGet } from "@/lib/api";
import { Calendar, Clock, MapPin, Play } from "lucide-react";
import { useEffect, useState } from "react";

export default function EventCountdown() {
  const [event, setEvent] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvent();
  }, []);

  useEffect(() => {
    if (!event) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const eventTime = new Date(event.eventDate).getTime();
      const diff = eventTime - now;

      if (diff <= 0) {
        setIsLive(true);
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [event]);

  async function loadEvent() {
    try {
      const data = await apiGet("/events");
      const activeEvents = (data.events || []).filter(e => e.isActive);
      if (activeEvents.length > 0) {
        // Get the next upcoming event
        const now = new Date().getTime();
        const upcomingEvents = activeEvents.filter(e => new Date(e.eventDate).getTime() > now);
        const nextEvent = upcomingEvents.length > 0 
          ? upcomingEvents.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))[0]
          : null;
        
        if (nextEvent) {
          setEvent(nextEvent);
        } else if (activeEvents.some(e => new Date(e.eventDate).getTime() <= now)) {
          // If there's a currently live event
          const liveEvent = activeEvents.find(e => new Date(e.eventDate).getTime() <= now);
          setEvent(liveEvent);
          setIsLive(true);
        }
      }
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !event) return null;

  return (
    <section className="event-countdown-section">
      <div className="event-countdown-card">
        <div className="event-countdown-header">
          <div className="event-badge">
            {isLive ? (
              <>
                <Play size={16} fill="currentColor" />
                مباشر الآن
              </>
            ) : (
              <>
                <Clock size={16} />
                قادم قريباً
              </>
            )}
          </div>
        </div>

        <h2 className="event-title">{event.title}</h2>
        {event.description && <p className="event-description">{event.description}</p>}

        <div className="event-meta">
          {event.location && (
            <span className="event-meta-item">
              <MapPin size={16} />
              {event.location}
            </span>
          )}
          <span className="event-meta-item">
            <Calendar size={16} />
            {new Date(event.eventDate).toLocaleString("ar-JO", {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>

        {isLive ? (
          <div className="event-live-indicator">
            <div className="live-pulse" />
            <span>الحدث بدأ الآن!</span>
          </div>
        ) : timeLeft ? (
          <div className="countdown-timer">
            <div className="countdown-item">
              <span className="countdown-value">{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="countdown-label">يوم</span>
            </div>
            <div className="countdown-item">
              <span className="countdown-value">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="countdown-label">ساعة</span>
            </div>
            <div className="countdown-item">
              <span className="countdown-value">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="countdown-label">دقيقة</span>
            </div>
            <div className="countdown-item">
              <span className="countdown-value">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="countdown-label">ثانية</span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
