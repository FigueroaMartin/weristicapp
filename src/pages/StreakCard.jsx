import { useRoutineStreak } from './useRoutineStreak'

export default function StreakCard() {
  const martinStreak = useRoutineStreak('Martín')
  const micaellaStreak = useRoutineStreak('Micaella')

  return (
    <div className="card">
      <div className="balance-row">
        <strong>Martín</strong>
        <span>🔥 racha de {martinStreak} día{martinStreak === 1 ? '' : 's'}</span>
      </div>
      <div className="balance-row">
        <strong>Micaella</strong>
        <span>🔥 racha de {micaellaStreak} día{micaellaStreak === 1 ? '' : 's'}</span>
      </div>
    </div>
  )
}
