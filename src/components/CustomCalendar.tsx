/* ============================================================
   CustomCalendar — Calendario visual interactivo con selección
   de Día Único y Rango de Fechas en 2 Clicks ("Seleccionar Hasta")
   ============================================================ */
import { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiFilter, FiX } from 'react-icons/fi';
import './CustomCalendar.css';

interface Props {
  /** Set de números de día de semana disponibles (1=Lun...7=Dom) */
  diasDisponibles?: Set<number>;
  /** Set de fechas (YYYY-MM-DD) que poseen turnos agendados */
  fechasConTurnos?: Set<string>;
  /** Set de fechas (YYYY-MM-DD) sin cupos de atención disponibles (lleno/bloqueado) */
  fechasSinCupo?: Set<string>;
  /** Si true, permite seleccionar días pasados */
  allowPastDays?: boolean;
  /** Fecha seleccionada en formato YYYY-MM-DD (para modo día único) */
  selectedDate?: string;
  /** Rango inicial/actual: fecha desde */
  startDate?: string;
  /** Rango inicial/actual: fecha hasta */
  endDate?: string;
  /** Callback al seleccionar fecha única o rango */
  onChange?: (date: string) => void;
  /** Callback al seleccionar rango (start, end) */
  onChangeRange?: (start: string, end: string) => void;
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function CustomCalendar({
  diasDisponibles,
  fechasConTurnos,
  fechasSinCupo,
  allowPastDays = false,
  selectedDate,
  startDate,
  endDate,
  onChange,
  onChangeRange,
}: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  // Estado de Selección de Rango en 2 Clicks
  const [isRangeActive, setIsRangeActive] = useState(false);
  const [rangeStart, setRangeStart] = useState<string | null>(null);

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

    // Si la fecha está explícitamente sin cupos disponibles (lleno) -> Bloquear selección
    if (fechasSinCupo && fechasSinCupo.has(iso)) return false;

    // Si no se permiten días pasados y la fecha es anterior a hoy
    if (!allowPastDays && d < today) return false;

    // Si se permiten días pasados (ej. consulta de agenda / filtros), el día es seleccionable
    if (allowPastDays) return true;

    // Si hay turnos agendados en esta fecha específica -> Disponible
    if (fechasConTurnos && fechasConTurnos.has(iso)) return true;

    // Si el médico tiene días de atención asignados -> SOLO se pueden clickear sus días de la semana
    if (diasDisponibles && diasDisponibles.size > 0) {
      const dayOfWeek = d.getDay() === 0 ? 7 : d.getDay(); // 1=Lun...7=Dom
      return diasDisponibles.has(dayOfWeek);
    }

    // Si no se definieron días de atención ni turnos específicos, permitir días futuros por defecto
    return true;
  };

  const handleDayClick = (day: number) => {
    const iso = toISO(day);

    if (isRangeActive) {
      if (!rangeStart) {
        // Primer click: definir inicio
        setRangeStart(iso);
      } else {
        // Segundo click: definir fin y emitir rango
        let s = rangeStart;
        let e = iso;
        if (e < s) [s, e] = [e, s];

        if (onChangeRange) onChangeRange(s, e);
        if (onChange) onChange(s);

        setRangeStart(null);
      }
    } else {
      // Modo Día Único
      if (onChange) onChange(iso);
      if (onChangeRange) onChangeRange(iso, iso);
    }
  };

  const handleToggleRangeMode = () => {
    if (isRangeActive) {
      setIsRangeActive(false);
      setRangeStart(null);
    } else {
      setIsRangeActive(true);
      setRangeStart(null);
    }
  };

  // Verificación de estados de día
  const isSelected = (day: number) => {
    const iso = toISO(day);
    if (rangeStart && iso === rangeStart) return true;
    if (selectedDate && iso === selectedDate) return true;
    if (startDate && iso === startDate) return true;
    if (endDate && iso === endDate) return true;
    return false;
  };

  const isInRange = (day: number) => {
    const iso = toISO(day);
    const start = rangeStart || startDate;
    const end = endDate;
    if (start && end && start !== end) {
      return iso > start && iso < end;
    }
    return false;
  };

  const isToday = (day: number) => toISO(day) === today.toISOString().split('T')[0];

  return (
    <div className="cal-wrapper">
      <div className="cal-header">
        <button type="button" className="cal-nav" onClick={goPrev}><FiChevronLeft /></button>
        <span className="cal-month-label">{MESES[viewMonth]} {viewYear}</span>
        <button type="button" className="cal-nav" onClick={goNext}><FiChevronRight /></button>
      </div>

      {/* Botón de Modo Rango / "Seleccionar Hasta" */}
      {onChangeRange && (
        <div className="cal-mode-bar">
          <button
            type="button"
            className={`btn btn-xs ${isRangeActive ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleToggleRangeMode}
          >
            <FiFilter /> {isRangeActive ? 'Cancelando Rango' : 'Seleccionar Hasta (Rango 2 Clicks)'}
          </button>

          {isRangeActive && (
            <span className="cal-mode-hint">
              {!rangeStart ? '1° Click: Día Inicio' : '2° Click: Día Hasta'}
            </span>
          )}

          {(startDate && endDate && startDate !== endDate && !isRangeActive) && (
            <button
              type="button"
              className="cal-clear-range"
              onClick={() => {
                const todayIso = today.toISOString().split('T')[0];
                onChangeRange(todayIso, todayIso);
                if (onChange) onChange(todayIso);
              }}
              title="Volver a día único"
            >
              <FiX /> Limpiar rango ({startDate} al {endDate})
            </button>
          )}
        </div>
      )}

      <div className="cal-grid">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="cal-day-name">{d}</div>
        ))}
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} />;
          const iso = toISO(day);
          const isFull = fechasSinCupo?.has(iso);
          const avail = isAvailable(day);
          const sel = isSelected(day);
          const inRange = isInRange(day);
          const tod = isToday(day);
          const hasTurnos = fechasConTurnos?.has(iso);

          return (
            <button
              key={day}
              type="button"
              disabled={!avail}
              onClick={() => avail && handleDayClick(day)}
              title={isFull ? 'Sin cupos disponibles (lleno)' : undefined}
              className={[
                'cal-day',
                isFull ? 'cal-day--full' : (avail ? 'cal-day--available' : 'cal-day--disabled'),
                sel ? 'cal-day--selected' : '',
                inRange ? 'cal-day--in-range' : '',
                tod && !sel ? 'cal-day--today' : '',
                hasTurnos ? 'cal-day--has-turnos' : '',
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
        {fechasSinCupo && fechasSinCupo.size > 0 && (
          <span className="cal-legend-item"><span className="cal-dot cal-dot--full" /> Sin Cupo (Lleno)</span>
        )}
        {onChangeRange && <span className="cal-legend-item"><span className="cal-dot cal-dot--range" /> Rango</span>}
      </div>
    </div>
  );
}
