import { MONSTER_RECIPES } from '../game/monsters.js'

export function MonsterTile({ type }) {
  const parts = MONSTER_RECIPES[type]
  if (!parts) {
    return <span className="monster-fallback">?</span>
  }

  return (
    <span className={`monster monster-${type}`} aria-hidden="true">
      {parts.map((part, index) => {
        const transforms = [
          part.flip ? 'scaleX(-1)' : '',
          part.rotate ? `rotate(${part.rotate}deg)` : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <img
            key={`${part.src}-${index}`}
            className="monster-part"
            src={`/monsters/${part.src}.png`}
            alt=""
            draggable="false"
            style={{
              left: `${part.x}%`,
              top: `${part.y}%`,
              width: `${part.w}%`,
              zIndex: part.z ?? 3,
              transform: transforms || undefined,
            }}
          />
        )
      })}
    </span>
  )
}
