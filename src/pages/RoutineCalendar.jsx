import { useMemo, useState } from 'react'
import { usePerson } from '../PersonContext'
import { useRoutineData } from './useRoutineData'
import RoutineDayDetail from './RoutineDayDetail'
import { sameDay, WEEKDAY_SHORT, MONTH_NAMES, getWeekDays, getMonthMatrix } from './dateUtils'

export default function RoutineCalendar({ logs = [], open = false, onToggle }) {
  const { person } = usePerson()
  const { routines, exercises, loading, reload } = useRoutineData(person)
  const [viewMode, setViewMode] = useState('month')
  const [referenceDate, setReferenceDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const today = useMemo(() => new Date(), [])

  const goPrev = () => {
    const d = new Date(referenceDate)
    if (viewMode === 'week') d.setDate(d.getDate() - 7)
    else if (viewMode === 'month') d.setMonth(d.getMonth() - 1)
    else d.setFullYear(d.getFullYear() - 1)
    setReferenceDate(d)
  }
  const goNext = () => {
    const d = new Date(referenceDate)
    if (viewMode === 'week') d.setDate(d.getDate() + 7)
    else if (viewMode === 'month') d.setMonth(d.getMonth() + 1)
    else d.setFullYear(d.getFullYear() + 1)
    setReferenceDate(d)
  }
  const goToday = () => {
    const now = new Date()
    setReferenceDate(now)
    setSelectedDate(now)
  }

  const handlePickDay = (d) => setSelectedDate(d)

  const renderDayCell = (d, muted) => {
    const weekday = d.getDay()
    const routine = routines[weekday]
    const isToday = sameDay(d, today)
    const isSelected = sameDay(d, selectedDate)
    return (
      <button
        type="button"
        key={d.toISOString()}
        className={[
          'cal-day',
          muted ? 'muted' : '',
          isToday ? 'today' : '',
          isSelected ? 'selected' : '',
          routine && !routine.is_rest && routine.title ? 'has-routine' : '',
        ].join(' ').trim()}
        onClick={() => handlePickDay(d)}
      >
        <span className="cal-day-num">{d.getDate()}</span>
        {routine && (
          routine.is_rest
            ? <span className="cal-day-dot rest" />
            : routine.title ? <span className="cal-day-dot active" /> : null
        )}
      </button>
    )
  }

  const label = viewMode === 'week'
    ? `Semana del ${getWeekDays(referenceDate)[0].getDate()} de ${MONTH_NAMES[getWeekDays(referenceDate)[0].getMonth()]}`
    : viewMode === 'month'
      ? `${MONTH_NAMES[referenceDate.getMonth()]} ${referenceDate.getFullYear()}`
      : `${referenceDate.getFullYear()}`

  if (!person) {
    return (
      <div className="card calendar-card">
        <p className="empty">Elige tu perfil (Martín o Micaella) arriba para ver tu calendario de rutina.</p>
      </div>
    )
  }

  return (
    <div className="card calendar-card">
      <button type="button" className="collapsible-toggle" onClick={() => onToggle?.((v) => !v)}>
        <span>📅 Calendario</span>
        <span className={`collapsible-chevron ${open ? 'open' : ''}`}>▾</span>
      </button>

      {open && (
        <>
          <div className="collapsible-body calendar-body">
            <div className="calendar-header">
              <div className="calendar-nav">
                <button type="button" className="cal-nav-btn" onClick={goPrev}>‹</button>
                <span className="calendar-label">{label}</span>
                <button type="button" className="cal-nav-btn" onClick={goNext}>›</button>
                <button type="button" className="cal-today-btn" onClick={goToday}>Hoy</button>
              </div>
              <div className="toggle-group calendar-view-toggle">
                <button type="button" className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>Semana</button>
                <button type="button" className={viewMode === 'month' ? 'active' : ''} onClick={() => setViewMode('month')}>Mes</button>
                <button type="button" className={viewMode === 'year' ? 'active' : ''} onClick={() => setViewMode('year')}>Año</button>
              </div>
            </div>

            {viewMode === 'week' && (
              <div className="cal-grid">
                {WEEKDAY_SHORT.map((w) => <div key={w} className="cal-weekday">{w}</div>)}
                {getWeekDays(referenceDate).map((d) => renderDayCell(d, false))}
              </div>
            )}

            {viewMode === 'month' && (
              <div className="cal-grid">
                {WEEKDAY_SHORT.map((w) => <div key={w} className="cal-weekday">{w}</div>)}
                {getMonthMatrix(referenceDate).flat().map((d) => renderDayCell(d, d.getMonth() !== referenceDate.getMonth()))}
              </div>
            )}

            {viewMode === 'year' && (
              <div className="cal-year-grid">
                {Array.from({ length: 12 }, (_, m) => new Date(referenceDate.getFullYear(), m, 1)).map((monthDate) => (
                  <div key={monthDate.getMonth()} className="cal-mini-month">
                    <button
                      type="button"
                      className="cal-mini-month-title"
                      onClick={() => { setReferenceDate(monthDate); setViewMode('month') }}
                    >
                      {MONTH_NAMES[monthDate.getMonth()]}
                    </button>
                    <div className="cal-mini-grid">
                      {getMonthMatrix(monthDate).flat().map((d) => {
                        const isCurrentMonth = d.getMonth() === monthDate.getMonth()
                        const isSelected = sameDay(d, selectedDate)
                        const isToday = sameDay(d, today)
                        return (
                          <button
                            type="button"
                            key={d.toISOString()}
                            className={[
                              'cal-mini-day',
                              !isCurrentMonth ? 'muted' : '',
                              isToday ? 'today' : '',
                              isSelected ? 'selected' : '',
                            ].join(' ').trim()}
                            onClick={() => handlePickDay(d)}
                          >
                            {d.getDate()}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <RoutineDayDetail
            person={person}
            date={selectedDate}
            routines={routines}
            exercises={exercises}
            loading={loading}
            logs={logs}
            onChanged={reload}
          />
        </>
      )}
    </div>
  )
}
