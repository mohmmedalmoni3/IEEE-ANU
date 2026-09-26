"use client";

import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock3, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const weekdays = Array.from({ length: 7 }, (_, index) =>
  new Intl.DateTimeFormat("ar-JO", { weekday: "short" }).format(new Date(2024, 0, 7 + index))
);

function localDatePart(value) {
  return value?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || "";
}

function localTimePart(value) {
  return value?.match(/T(\d{2}:\d{2})/)?.[1] || "";
}

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("ar-JO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .format(new Date(year, month - 1, day, 12));
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

export default function WorkshopDateTimePicker({
  value,
  onChange,
  label,
  placeholder = "اختر التاريخ والوقت",
  allowClear = false,
  minValue = ""
}) {
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState("");
  const [draftHour, setDraftHour] = useState("09");
  const [draftMinute, setDraftMinute] = useState("00");
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function handlePointerDown(event) {
      if (!pickerRef.current?.contains(event.target)) setOpen(false);
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function showPicker() {
    const date = localDatePart(value) || dateKey(new Date());
    const time = localTimePart(value) || "09:00";
    setDraftDate(date);
    setDraftHour(time.slice(0, 2));
    setDraftMinute(time.slice(3, 5));
    const [year, month, day] = date.split("-").map(Number);
    setVisibleMonth(new Date(year, month - 1, day, 12));
    setOpen(true);
  }

  function isBeforeMinimum(date, hour = draftHour, minute = draftMinute) {
    if (!minValue) return false;
    const candidate = `${date}T${hour}:${minute}`;
    return candidate < minValue.slice(0, 16);
  }

  function changeMonth(amount) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1, 12));
  }

  function updateHour(amount) {
    setDraftHour((current) => String(clampNumber(Number(current) + amount, 0, 23, 9)).padStart(2, "0"));
  }

  function updateMinute(amount) {
    setDraftMinute((current) => String((Number(current) + amount * 5 + 60) % 60).padStart(2, "0"));
  }

  function commit() {
    if (!draftDate || isBeforeMinimum(draftDate)) return;
    onChange(`${draftDate}T${draftHour}:${draftMinute}`);
    setOpen(false);
  }

  function clearValue() {
    onChange("");
    setOpen(false);
  }

  const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1, 12);
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const calendarCells = [
    ...Array.from({ length: firstDay.getDay() }, (_, index) => ({ key: `empty-${index}`, empty: true })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day, 12);
      const key = dateKey(date);
      return { key, day, date: key, empty: false };
    })
  ];

  return (
    <div className="workshop-date-time-picker" ref={pickerRef}>
      <button
        type="button"
        className={value ? "workshop-date-time-trigger selected" : "workshop-date-time-trigger"}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => open ? setOpen(false) : showPicker()}
      >
        <span className="workshop-date-time-trigger-icon"><CalendarDays size={19} /></span>
        <span className="workshop-date-time-trigger-copy">
          <strong>{value ? formatDate(localDatePart(value)) : placeholder}</strong>
          <small>{value ? `${localTimePart(value)} · توقيت محلي` : "اختر اليوم والساعة"}</small>
        </span>
        <ChevronDown className={open ? "workshop-date-time-chevron active" : "workshop-date-time-chevron"} size={18} />
      </button>

      {open && <div className="workshop-date-time-popover" role="dialog" aria-label={label}>
        <div className="workshop-calendar-header">
          <button type="button" className="workshop-calendar-nav" aria-label="الشهر السابق" onClick={() => changeMonth(-1)}><ChevronRight size={18} /></button>
          <strong>{new Intl.DateTimeFormat("ar-JO", { month: "long", year: "numeric" }).format(visibleMonth)}</strong>
          <button type="button" className="workshop-calendar-nav" aria-label="الشهر التالي" onClick={() => changeMonth(1)}><ChevronLeft size={18} /></button>
        </div>

        <div className="workshop-calendar-grid workshop-calendar-weekdays">
          {weekdays.map((weekday, index) => <span key={`${weekday}-${index}`}>{weekday}</span>)}
        </div>
        <div className="workshop-calendar-grid workshop-calendar-days">
          {calendarCells.map((cell) => cell.empty
            ? <span className="workshop-calendar-empty" key={cell.key} />
            : <button
              type="button"
              key={cell.key}
              className={`workshop-calendar-day${draftDate === cell.date ? " selected" : ""}${dateKey(new Date()) === cell.date ? " today" : ""}`}
              disabled={isBeforeMinimum(cell.date, "23", "59")}
              aria-pressed={draftDate === cell.date}
              onClick={() => setDraftDate(cell.date)}
            >{cell.day}</button>)}
        </div>

        <div className="workshop-time-picker-panel">
          <div className="workshop-time-picker-heading"><Clock3 size={17} /><strong>حدد وقت الورشة</strong><span>24 ساعة</span></div>
          <div className="workshop-time-steppers">
            <div className="workshop-time-stepper">
              <button type="button" aria-label="زيادة الساعة" onClick={() => updateHour(1)}><ChevronUp size={17} /></button>
              <input aria-label="الساعة" inputMode="numeric" value={draftHour} onChange={(event) => setDraftHour(String(clampNumber(event.target.value, 0, 23, 9)).padStart(2, "0"))} />
              <button type="button" aria-label="تقليل الساعة" onClick={() => updateHour(-1)}><ChevronDown size={17} /></button>
              <small>الساعة</small>
            </div>
            <span className="workshop-time-separator">:</span>
            <div className="workshop-time-stepper">
              <button type="button" aria-label="زيادة الدقائق خمس دقائق" onClick={() => updateMinute(1)}><ChevronUp size={17} /></button>
              <input aria-label="الدقائق" inputMode="numeric" value={draftMinute} onChange={(event) => setDraftMinute(String(Math.min(59, Math.max(0, Number.parseInt(event.target.value, 10) || 0))).padStart(2, "0"))} />
              <button type="button" aria-label="تقليل الدقائق خمس دقائق" onClick={() => updateMinute(-1)}><ChevronDown size={17} /></button>
              <small>الدقائق</small>
            </div>
          </div>
        </div>

        <div className="workshop-date-time-actions">
          {allowClear && value && <button type="button" className="workshop-date-time-clear" onClick={clearValue}><X size={15} /> مسح الموعد</button>}
          <button type="button" className="workshop-date-time-apply" disabled={!draftDate || isBeforeMinimum(draftDate)} onClick={commit}><Check size={16} /> اعتماد الموعد</button>
        </div>
      </div>}
    </div>
  );
}
