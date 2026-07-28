import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { usePerson } from '../PersonContext'
import { useRoutineData } from './useRoutineData'
import RoutineDayDetail from './RoutineDayDetail'
import { sameDay, toDateKey, WEEKDAY_SHORT, MONTH_NAMES, getWeekDays, getMonthMatrix } from './dateUtils'

function getVisibleBounds(viewMode, referenceDate) {
  if (viewMode === 'week') {
    const days = getWeekDays(referenceDate)
    return [days[0], days[6]]
  }
  if (viewMode === 'year') {
    return [new Date(referenceDate.getFullYear(), 0, 1), new Date(referenceDate.getFullYear(), 11, 31)]
  }
  const matrix = getMonthMatrix(referenceDate)
  return [matrix[0][0], matrix[matrix.length - 1][6]]
}

function liquidColor(percent) {
  const hue = Math.max(0, Math.min(120, percent * 1.2))
  return `hsl(${hue}, 72%, 46%)`
}

export default function RoutineCalendar({ logs = [], open = false, onToggle }) {
  const { person } = usePerson()
  const { routines, exercises, loading, reload } = useRoutineData(person)
  const [viewMode, setViewMode] = useState('month')
  const [referenceDate, setReferenceDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [rangeCompletions, setRangeCompletions] = useState([])

  const today = useMemo(() => new Date(), [])

  const loadRangeCompletions = () => {
    if (!open || !person) return
    const [start, end] = getVisibleBounds(viewMode, referenceDate)
    supabase
      .from('exercise_completions')
      .select('*')
      .gte('date', toDateKey(start))
      .lte('date', toDateKey(end))
      .then(({ data, error }) => {
        if (!error) setRangeCompletions(data || [])
      })
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(loadRangeCompletions, [open, person, viewMode, referenceDate, exercises])

  const dayStats = (d) => {
    const weekday = d.getDay()
    const dayExercises = exercises[weekday] || []
    if (dayExercises.length === 0) return null

    const dateKey = toDateKey(d)
    const ids = new Set(dayExercises.map((ex) => ex.id))
    const relevant = rangeCompletions.filter((c) => c.date === dateKey && ids.has(c.exercise_id))
    if (relevant.length === 0) return null

    const score = relevant.reduce((sum, c) => sum + (c.status === 'completo' ? 1 : c.status === 'parcial' ? 0.5 : 0), 0)
    const percent = Math.round((score / dayExercises.length) * 100)
    return { percent, color: liquidColor(percent) }
  }

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
    const stats = dayStats(d)
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
        {stats && (
          <span
            className="cal-day-liquid"
            style={{ '--fill': `${stats.percent}%`, '--liquid-color': stats.color }}
          />
        )}
        <span className="cal-day-num">{d.getDate()}</span>
        {routine?.is_rest && <span className="cal-day-dot rest" />}
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
                        const stats = dayStats(d)
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
                            style={stats ? { background: stats.color, opacity: 0.35 + (stats.percent / 100) * 0.65 } : undefined}
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
            onCompletionChanged={loadRangeCompletions}
          />
        </>
      )}
    </div>
  )
}
