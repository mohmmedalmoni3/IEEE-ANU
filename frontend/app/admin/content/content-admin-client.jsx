"use client";

import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

const sections = [
  { key: "stats", label: "الإحصائيات", fields: ["label", "value", "sortOrder"] },
  { key: "creators", label: "صناع المحتوى", fields: ["name", "role", "platform", "followers", "url", "sortOrder"] },
  { key: "videos", label: "الفيديوهات", fields: ["title", "speaker", "youtubeId", "views", "sortOrder"] },
  { key: "products", label: "المتجر", fields: ["name", "price", "status", "sortOrder"] },
  { key: "team", label: "أعضاء الفريق", fields: ["name", "role", "imageUrl", "portfolioUrl", "sortOrder"] }
];

const labels = {
  label: "العنوان",
  value: "القيمة",
  sortOrder: "الترتيب",
  name: "الاسم",
  role: "الوصف/الدور",
  platform: "المنصة",
  followers: "المتابعون",
  url: "الرابط",
  title: "عنوان الفيديو",
  speaker: "المتحدث",
  youtubeId: "YouTube ID",
  views: "المشاهدات",
  price: "السعر",
  status: "الحالة",
  imageUrl: "رابط الصورة",
  portfolioUrl: "رابط البورتفوليو"
};

const emptyForms = {
  stats: { label: "", value: 0, sortOrder: 0 },
  creators: { name: "", role: "", platform: "YouTube", followers: "", url: "", sortOrder: 0 },
  videos: { title: "", speaker: "", youtubeId: "", views: "", sortOrder: 0 },
  products: { name: "", price: "قريبا", status: "تحت التجهيز", sortOrder: 0 },
  team: { name: "", role: "", imageUrl: "", portfolioUrl: "", sortOrder: 0 }
};

export default function ContentAdminClient() {
  const [content, setContent] = useState({ stats: [], creators: [], videos: [], products: [], team: [] });
  const [active, setActive] = useState("stats");
  const [forms, setForms] = useState(emptyForms);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const section = useMemo(() => sections.find((item) => item.key === active), [active]);

  function load() {
    Promise.all([
      apiGet("/admin/content"),
      apiGet("/team-members")
    ])
      .then(([contentData, teamData]) => setContent({
        stats: contentData.stats || [],
        creators: contentData.creators || [],
        videos: contentData.videos || [],
        products: contentData.products || [],
        team: teamData.members || []
      }))
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function updateForm(field, value) {
    setForms((current) => ({
      ...current,
      [active]: { ...current[active], [field]: value }
    }));
  }

  function startEdit(item) {
    setEditing(item.id);
    setForms((current) => ({ ...current, [active]: { ...emptyForms[active], ...item } }));
  }

  function resetForm() {
    setEditing(null);
    setForms((current) => ({ ...current, [active]: emptyForms[active] }));
  }

  async function save(event) {
    event.preventDefault();
    setMessage("");
    const payload = forms[active];
    try {
      if (active === "team") {
        // Use team members API
        if (editing) {
          await apiPatch(`/team-members/${editing}`, payload);
          setMessage("تم تحديث العضو بنجاح.");
        } else {
          await apiPost("/team-members", payload);
          setMessage("تمت إضافة العضو بنجاح.");
        }
      } else {
        // Use content API
        if (editing) {
          await apiPatch(`/admin/content/${active}/${editing}`, payload);
          setMessage("تم تحديث المحتوى بنجاح.");
        } else {
          await apiPost(`/admin/content/${active}`, payload);
          setMessage("تمت إضافة المحتوى بنجاح.");
        }
      }
      resetForm();
      load();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function remove(item) {
    if (!window.confirm("هل أنت متأكد من حذف هذا العنصر؟")) return;
    if (active === "team") {
      await apiDelete(`/team-members/${item.id}`);
    } else {
      await apiDelete(`/admin/content/${active}/${item.id}`);
    }
    load();
  }

  if (loading) {
    return <section className="page-content"><div className="info-card center">جاري تحميل المحتوى...</div></section>;
  }

  return (
    <section className="page-content admin-content-page">
      <div className="admin-tabs">
        {sections.map((item) => (
          <button key={item.key} className={active === item.key ? "active" : ""} type="button" onClick={() => { setActive(item.key); resetForm(); }}>
            {item.label}
          </button>
        ))}
      </div>

      {message && <div className="notice admin-notice">{message}</div>}

      <form className="content-editor" onSubmit={save}>
        <h2>{editing ? "تعديل عنصر" : `إضافة ${section.label}`}</h2>
        <div className="content-form-grid">
          {section.fields.map((field) => (
            <label key={field}>
              {labels[field]}
              {active === "team" && field === "imageUrl" ? (
                <div>
                  <input
                    type="text"
                    placeholder="اسم الصورة (مثال: loai.jpg)"
                    value={forms[active].imageUrl ?? ""}
                    onChange={(event) => updateForm(field, event.target.value)}
                  />
                  <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>
                    ضع الصور في مجلد frontend/public/team-images
                  </p>
                  {forms[active].imageUrl && (
                    <div style={{ marginTop: "8px" }}>
                      <img
                        src={`/team-images/${forms[active].imageUrl}`}
                        alt="Preview"
                        style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px" }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type={field === "value" || field === "sortOrder" ? "number" : "text"}
                  value={forms[active][field] ?? ""}
                  onChange={(event) => updateForm(field, event.target.value)}
                />
              )}
            </label>
          ))}
        </div>
        <div className="details-actions">
          <button className="submit-btn" type="submit">{editing ? "حفظ التعديل" : "إضافة"}</button>
          {editing && <button className="status-action pending" type="button" onClick={resetForm}>إلغاء</button>}
        </div>
      </form>

      <div className="content-list">
        {(content[active] || []).map((item) => (
          <article className="content-item-card" key={item.id}>
            <div>
              <h3>{item.label || item.name || item.title}</h3>
              <p>{item.role || item.speaker || item.status || `القيمة: ${item.value}`}</p>
            </div>
            <span>ترتيب {item.sortOrder ?? 0}</span>
            <div className="admin-user-actions">
              <button className="status-action accepted" type="button" onClick={() => startEdit(item)}>تعديل</button>
              <button className="status-action delete" type="button" onClick={() => remove(item)}>حذف</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
