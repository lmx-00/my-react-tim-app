import { tileEmoji, tileLabel } from '../game/tiles.js'

export function Board({ board, selected, onSelect, disabled, shaking }) {
  if (!board) return null

  return (
    <div
      className={`board${shaking ? ' is-shaking' : ''}`}
      style={{ '--cols': board.cols }}
    >
      {board.cells.flatMap((row, y) =>
        row.map((tile, x) => {
          const isSelected = selected?.x === x && selected?.y === y
          return (
            <button
              key={`${y}-${x}`}
              type="button"
              className={`tile tile-${tile?.type ?? 'empty'}${isSelected ? ' is-selected' : ''}`}
              disabled={disabled || !tile}
              aria-label={`第${y + 1}行第${x + 1}列 ${tileLabel(tile)}`}
              onClick={() => onSelect({ x, y })}
            >
              {tileEmoji(tile)}
            </button>
          )
        }),
      )}
    </div>
  )
}
