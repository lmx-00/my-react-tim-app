import { tileLabel } from '../game/tiles.js'
import { MonsterTile } from './MonsterTile.jsx'

export function Board({ board, selected, onSelect, disabled, shaking, blasting }) {
  if (!board) return null
  const blastSet = new Set(blasting ?? [])

  return (
    <div
      className={`board${shaking ? ' is-shaking' : ''}`}
      style={{ '--cols': board.cols }}
    >
      {board.cells.flatMap((row, y) =>
        row.map((tile, x) => {
          const isSelected = selected?.x === x && selected?.y === y
          const isBlasting = blastSet.has(`${y}-${x}`)
          return (
            <button
              key={`${y}-${x}`}
              type="button"
              className={`tile tile-${tile?.type ?? 'empty'}${isSelected ? ' is-selected' : ''}${isBlasting ? ' is-blasting' : ''}`}
              disabled={disabled || !tile}
              aria-label={`第${y + 1}行第${x + 1}列 ${tileLabel(tile)}`}
              onClick={() => onSelect({ x, y })}
            >
              {tile?.type ? <MonsterTile type={tile.type} /> : null}
            </button>
          )
        }),
      )}
    </div>
  )
}
