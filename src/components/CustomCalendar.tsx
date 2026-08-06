/* ============================================================
   CustomCalendar — Calendario visual con días disponibles en verde
   ============================================================ */
import { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './CustomCalendar.css';

interface Props {
  /** Set de números de día de semana disponibles (1=Lun...7=Dom) */
  diasDisponibles?: Set<number>;
  /** Set de fechas (YYYY-MM-DD) que poseen turnos agendados */
  fechasConTurnos?: Set<string>;
  /** Si true, permite seleccionar días pasados (útil para auditoría de médicos/secretarios) */
  allowPastDays?: boolean;
  /** Fecha seleccionada en formato YYYY-MM-DD */
  selectedDate: string;
  onChange: (date: string) => void;
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function CustomCalendar({
  diasDisponibles,
  fechasConTurnos,
  allowPastDays = false,
  selectedDate,
  onChange,
}: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  const goPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const goNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const firstDayLunFirst = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayLunFirst).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const toISO = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${viewYear}-${m}-${d}`;
  };

  const isAvailable = (day: number) => {
    const iso = toISO(day);
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    if (!allowPastDays && d < today) return false;

    // Si hay fechasConTurnos explícitas, el día es activo si tiene turnos
    if (fechasConTurnos && fechasConTurnos.has(iso)) return true;

    // Si no se pasaron días disponibles o el Set está vacío, todos los días son seleccionables
    if (!diasDisponibles || diasDisponibles.size === 0) return true;

    const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay(); // 1=Lun...7=Dom
    return diasDisponibles.has(dayOfWeek);
  };

  const isSelected = (day: number) => toISO(day) === selectedDate;
  const isToday = (day: number) => toISO(day) === today.toISOString().split('T')[0];

  return (
    <div className="cal-wrapper">
      <div className="cal-header">
        <button type="button" className="cal-nav" onClick={goPrev}><FiChevronLeft /></button>
        <span className="cal-month-label">{MESES[viewMonth]} {viewYear}</span>
        <button type="button" className="cal-nav" onClick={goNext}><FiChevronRight /></button>
      </div>

      <div className="cal-grid">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="cal-day-name">{d}</div>
        ))}
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} />;
          const avail = isAvailable(day);
          const sel = isSelected(day);
          const tod = isToday(day);
          return (
            <button
              key={day}
              type="button"
              disabled={!avail}
              onClick={() => avail && onChange(toISO(day))}
              className={[
                'cal-day',
                avail ? 'cal-day--available' : 'cal-day--disabled',
                sel ? 'cal-day--selected' : '',
                tod && !sel ? 'cal-day--today' : '',
              ].join(' ')}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="cal-legend">
        <span className="cal-legend-item"><span className="cal-dot cal-dot--available" /> Disponible</span>
        <span className="cal-legend-item"><span className="cal-dot cal-dot--selected" /> Seleccionado</span>
      </div>
    </div>
  );
}
