"use client";

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { Calendar, Clock, MapPin, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function EventsAdminClient() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventDate: "",
    location: ""
  });

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const data = await apiGet("/events");
      setEvents(data.events || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    
    try {
      if (editingEvent) {
        await apiPatch(`/events/${editingEvent.id}`, formData);
        setMessage("تم تحديث الحدث بنجاح.");
      } else {
        await apiPost("/events", formData);
        setMessage("تم إضافة الحدث بنجاح.");
      }
      
      setFormData({ title: "", description: "", eventDate: "", location: "" });
      setShowForm(false);
      setEditingEvent(null);
      loadEvents();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleDelete(id) {
    const ok = window.confirm("هل أنت متأكد من حذف هذا الحدث؟");
    if (!ok) return;
    
    try {
      await apiDelete(`/events/${id}`);
      setMessage("تم حذف الحدث بنجاح.");
      loadEvents();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function handleEdit(event) {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      eventDate: event.eventDate.slice(0, 16),
      location: event.location || ""
    });
    setShowForm(true);
  }

  function handleToggleActive(event) {
    apiPatch(`/events/${event.id}`, { isActive: !event.isActive })
      .then(() => {
        setMessage(`تم ${event.isActive ? "إيقاف" : "تفعيل"} الحدث بنجاح.`);
        loadEvents();
      })
      .catch((error) => setMessage(error.message));
  }

  if (loading) {
    return (
      <section className="page-content">
        <div className="info-card center">جاري تحميل الأحداث...</div>
      </section>
    );
  }

  return (
    <section className="page-content">
      <div className="admin-toolbar">
        <button className="btn btn-primary" type="button" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} /> {showForm ? "إخفاء النموذج" : "إضافة حدث جديد"}
        </button>
      </div>

      {message && <div className="notice admin-notice">{message}</div>}

      {showForm && (
        <div className="info-card" style={{ marginBottom: "20px" }}>
          <h3>{editingEvent ? "تعديل الحدث" : "إضافة حدث جديد"}</h3>
          <form onSubmit={handleSubmit} style={{ marginTop: "16px" }}>
            <label>
              عنوان الحدث
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="مثال: ورشة عمل تقنية"
              />
            </label>
            <label>
              الوصف
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="وصف تفصيلي للحدث..."
              />
            </label>
            <label>
              تاريخ ووقت الحدث
              <input
                type="datetime-local"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                required
              />
            </label>
            <label>
              الموقع
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="مثال: قاعة المحاضرات - جامعة عجلون الوطنية"
              />
            </label>
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button className="btn btn-primary" type="submit">
                {editingEvent ? "تحديث الحدث" : "إضافة الحدث"}
              </button>
              {editingEvent && (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => {
                    setEditingEvent(null);
                    setFormData({ title: "", description: "", eventDate: "", location: "" });
                  }}
                >
                  إلغاء
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="admin-list">
        {events.length === 0 ? (
          <div className="info-card center">لا توجد أحداث حالياً.</div>
        ) : (
          events.map((event) => (
            <article className="info-card" key={event.id} style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3>{event.title}</h3>
                  {event.description && <p style={{ marginTop: "8px" }}>{event.description}</p>}
                  <div style={{ display: "flex", gap: "16px", marginTop: "12px", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Calendar size={16} />
                      {new Date(event.eventDate).toLocaleString("ar-JO")}
                    </span>
                    {event.location && (
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <MapPin size={16} />
                        {event.location}
                      </span>
                    )}
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={16} />
                      {event.isActive ? "نشط" : "غير نشط"}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="btn btn-secondary" type="button" onClick={() => handleEdit(event)}>
                    تعديل
                  </button>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => handleToggleActive(event)}
                  >
                    {event.isActive ? "إيقاف" : "تفعيل"}
                  </button>
                  <button
                    className="btn btn-danger"
                    type="button"
                    onClick={() => handleDelete(event.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
