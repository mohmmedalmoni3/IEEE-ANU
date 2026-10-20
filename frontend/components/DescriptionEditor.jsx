"use client";

import { useId, useRef, useState } from "react";
import { Bold, Italic, Strikethrough, Heading2, List, ListOrdered, Quote, Link2, Minus, CheckCheck, Eye, PencilLine, Undo2, Redo2, RemoveFormatting } from "lucide-react";
import FormattedText from "@/components/FormattedText";
import { DESCRIPTION_LIMIT, safeContentLink } from "@/lib/formatted-text.mjs";

const sample = `هل تطمح لتطوير مهاراتك التقنية والقيادية؟\nهل تبحث عن بيئة تجمعك بطلاب مبدعين يشاركونك الشغف؟\n\nيسعدنا الإعلان عن فتح باب التسجيل للانضمام إلى **IEEE ANU Student Branch** للعام الجديد 🎉\n\n## ماذا ستكسب عند انضمامك؟\n- ✅ ورش عمل ودورات تدريبية في مجالات التكنولوجيا والهندسة\n- ✅ فرص لبناء شبكة علاقات مع طلاب ومختصين\n- ✅ مشاريع ومسابقات تطبّق فيها ما تتعلمه\n- ✅ تطوير المهارات القيادية والعمل الجماعي\n- ✅ خبرة عملية تعزّز سيرتك الذاتية`;

export default function DescriptionEditor({ value = "", onChange, label = "الوصف", placeholder = "اكتب الوصف هنا، وحدّد النص لتنسيقه من شريط الأدوات…" }) {
  const id = useId();
  const input = useRef(null);
  const selection = useRef({ start: 0, end: 0 });
  const history = useRef({ entries: [], index: -1 });
  const [mode, setMode] = useState("write");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [notice, setNotice] = useState("");

  function rememberSelection() {
    if (input.current) selection.current = { start: input.current.selectionStart, end: input.current.selectionEnd };
  }

  function update(next, start, end = start) {
    if (next.length > DESCRIPTION_LIMIT) { setNotice("وصل الوصف إلى الحد الأقصى. اختصر النص لإضافة تنسيق جديد."); return; }
    const state = history.current;
    // Reset history when switching between existing records or after saving.
    if (state.entries[state.index] !== value) { state.entries = [value]; state.index = 0; }
    state.entries = [...state.entries.slice(0, state.index + 1), next].slice(-60);
    state.index = state.entries.length - 1;
    onChange(next);
    setNotice("");
    if (start !== undefined) requestAnimationFrame(() => {
      input.current?.focus();
      input.current?.setSelectionRange(start, end);
      selection.current = { start, end };
    });
  }

  function undo(direction) {
    const state = history.current;
    if (state.entries[state.index] !== value) return;
    const index = state.index + direction;
    if (index < 0 || index >= state.entries.length) return;
    state.index = index;
    onChange(state.entries[index]);
  }

  function wrap(marker, fallback) {
    const { start, end } = selection.current;
    const selected = value.slice(start, end) || fallback;
    const alreadyWrapped = start >= marker.length && value.slice(start - marker.length, start) === marker && value.slice(end, end + marker.length) === marker;
    if (alreadyWrapped) {
      update(value.slice(0, start - marker.length) + selected + value.slice(end + marker.length), start - marker.length, start - marker.length + selected.length);
    } else if (selected.startsWith(marker) && selected.endsWith(marker) && selected.length > marker.length * 2) {
      const plain = selected.slice(marker.length, -marker.length);
      update(value.slice(0, start) + plain + value.slice(end), start, start + plain.length);
    } else update(value.slice(0, start) + marker + selected + marker + value.slice(end), start + marker.length, start + marker.length + selected.length);
  }

  function lines(prefix) {
    const { start, end } = selection.current;
    const from = start === 0 ? 0 : value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = value.indexOf("\n", end);
    const to = lineEnd === -1 ? value.length : lineEnd;
    const selected = value.slice(from, to) || "اكتب هنا";
    const next = selected.split("\n").map((line, index) => {
      const text = line.replace(/^(?:#{1,3}\s+|[-*+]\s+|\d+[.)]\s+|>\s?)/, "");
      return `${prefix === "number" ? `${index + 1}. ` : prefix}${text}`;
    }).join("\n");
    update(value.slice(0, from) + next + value.slice(to), from, from + next.length);
  }

  const tools = [
    [Bold, "خط عريض", () => wrap("**", "نص عريض")],
    [Italic, "خط مائل", () => wrap("*", "نص مائل")],
    [Strikethrough, "يتوسطه خط", () => wrap("~~", "نص")],
    [Heading2, "عنوان فرعي", () => lines("## ")],
    [List, "قائمة نقطية", () => lines("- ")],
    [ListOrdered, "قائمة مرقمة", () => lines("number")],
    [CheckCheck, "قائمة مزايا", () => lines("- ✅ ")],
    [Quote, "اقتباس", () => lines("> ")],
    [Link2, "إضافة رابط", () => { setLinkText(value.slice(selection.current.start, selection.current.end)); setLinkUrl(""); setLinkOpen(!linkOpen); }],
    [Minus, "فاصل", () => { const { end } = selection.current; const insertion = "\n\n---\n\n"; update(value.slice(0, end) + insertion + value.slice(end), end + insertion.length); }],
    [RemoveFormatting, "مسح تنسيق النص المحدد", () => {
      let { start, end } = selection.current;
      if (start === end) { setNotice("حدّد النص الذي تريد مسح تنسيقه أولًا."); return; }
      for (const marker of ["**", "__", "~~", "*"]) {
        if (start >= marker.length && value.slice(start - marker.length, start) === marker && value.slice(end, end + marker.length) === marker) { start -= marker.length; end += marker.length; }
      }
      const plain = value.slice(start, end).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*|__|~~|\*/g, "").replace(/^(?:#{1,3}\s+|[-+]\s+|\d+[.)]\s+|>\s?)/gm, "");
      update(value.slice(0, start) + plain + value.slice(end), start, start + plain.length);
    }],
    [Undo2, "تراجع", () => undo(-1)],
    [Redo2, "إعادة", () => undo(1)]
  ];

  return <div className="description-editor" dir="rtl">
    <div className="description-editor-header">
      <label htmlFor={id}>{label}<span>نسّق النص وشاهد النتيجة قبل النشر</span></label>
      <div className="description-editor-modes" role="group" aria-label="طريقة عرض الوصف">
        <button type="button" aria-pressed={mode === "write"} onClick={() => setMode("write")}><PencilLine size={15} /> كتابة</button>
        <button type="button" aria-pressed={mode === "preview"} onClick={() => setMode("preview")}><Eye size={15} /> معاينة</button>
      </div>
    </div>
    {mode === "write" && <>
      <div className="description-editor-toolbar" role="group" aria-label="تنسيق الوصف">
        {tools.map(([Icon, title, action]) => <button key={title} type="button" title={title} aria-label={title} onMouseDown={(event) => event.preventDefault()} onClick={action}><Icon size={18} /></button>)}
      </div>
      {linkOpen && <div className="description-editor-link" onKeyDown={(event) => { if (event.key === "Enter" && event.target.tagName === "INPUT") event.preventDefault(); }}>
        <label>نص الرابط<input value={linkText} onChange={(event) => setLinkText(event.target.value)} placeholder="مثال: تقديم الطلب" /></label>
        <label>عنوان الرابط<input type="text" inputMode="url" dir="ltr" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://…" /></label>
        <button type="button" className="btn btn-secondary" onClick={() => {
          if (!safeContentLink(linkUrl) || !linkText.trim() || /[\[\]\n]/.test(linkText)) { setNotice("أدخل نصًا للرابط وعنوانًا صحيحًا يبدأ بـ https:// أو http:// أو mailto:"); return; }
          const { start, end } = selection.current;
          const insertion = `[${linkText.trim()}](${safeContentLink(linkUrl).replaceAll("(", "%28").replaceAll(")", "%29")})`;
          update(value.slice(0, start) + insertion + value.slice(end), start + insertion.length);
          setLinkOpen(false);
        }}>إضافة الرابط</button>
        <button type="button" className="description-editor-cancel" onClick={() => setLinkOpen(false)}>إلغاء</button>
      </div>}
    </>}
    <div className={`description-editor-panels ${mode === "preview" ? "preview-only" : ""}`}>
      {mode === "write" && <textarea id={id} ref={input} dir="auto" value={value} maxLength={DESCRIPTION_LIMIT} rows={10} placeholder={placeholder} onSelect={rememberSelection} onBlur={rememberSelection} onChange={(event) => { update(event.target.value); rememberSelection(); }} onKeyDown={(event) => {
        if (!(event.ctrlKey || event.metaKey)) return;
        const key = event.key.toLowerCase();
        if (["b", "i", "z", "y"].includes(key)) {
          event.preventDefault(); rememberSelection();
          if (key === "b") wrap("**", "نص عريض");
          else if (key === "i") wrap("*", "نص مائل");
          else undo(key === "y" || event.shiftKey ? 1 : -1);
        }
      }} />}
      <div className="description-editor-preview" role="region" aria-label={`معاينة ${label}`}>
        <span className="description-preview-caption"><Eye size={14} /> المعاينة المباشرة</span>
        {value.trim() ? <FormattedText text={value} /> : <p className="description-preview-empty">سيظهر الوصف المنسّق هنا، كما سيراه زوار الموقع.</p>}
      </div>
    </div>
    <div className="description-editor-footer">
      <span>Enter لسطر جديد · سطر فارغ لفقرة جديدة</span>
      <span dir="ltr">{value.length.toLocaleString("ar-JO")} / {DESCRIPTION_LIMIT.toLocaleString("ar-JO")}</span>
    </div>
    <details className="description-editor-help"><summary>مساعدة في التنسيق وقالب جاهز</summary>
      <p>حدّد النص ثم اختر الأداة. يمكنك لصق نص منسّق بصيغة Markdown أو كتابة **نص عريض** وبدء قائمة بـ - أو 1. تبقى فواصل الأسطر محفوظة. لا يتغير عنوان الإعلان.</p>
      <button type="button" className="btn btn-secondary" disabled={Boolean(value.trim())} onClick={() => update(sample)}>استخدام قالب إعلان الانضمام</button>
      {value.trim() && <small>القالب متاح عندما يكون الوصف فارغًا.</small>}
    </details>
    {notice && <p className="description-editor-notice" role="status">{notice}</p>}
  </div>;
}
