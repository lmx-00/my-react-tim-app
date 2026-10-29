import { tileLabel } from '../game/tiles.js'
import { MonsterTile } from './MonsterTile.jsx'

function offset(step) {
  if (!step) return '0px'
  return step > 0 ? 'calc(100% + var(--tile-gap))' : 'calc(-100% - var(--tile-gap))'
}

// 交换时两个格子各自朝对方挪一格，动画靠 --swap-x / --swap-y 驱动
function swapStyle(swap, x, y) {
  if (!swap) return null
  const { from, to } = swap
  const isFrom = from.x === x && from.y === y
  const isTo = to.x === x && to.y === y
  if (!isFrom && !isTo) return null
  const sign = isFrom ? 1 : -1
  return {
    '--swap-x': offset((to.x - from.x) * sign),
    '--swap-y': offset((to.y - from.y) * sign),
  }
}

export function Board({ board, selected, onSelect, disabled, shaking, swap, effects }) {
  if (!board) return null
  const popping = new Set(effects?.popping ?? [])
  const spawning = new Set(effects?.spawning ?? [])
  const falling = effects?.falling ?? {}

  return (
    <div
      className={`board${shaking ? ' is-shaking' : ''}`}
      style={{
        '--cols': board.cols,
        ...(effects?.duration ? { '--step-ms': `${effects.duration}ms` } : null),
      }}
    >
      {board.cells.flatMap((row, y) =>
        row.map((tile, x) => {
          const key = `${y}-${x}`
          const moving = swapStyle(swap, x, y)
          const fall = falling[key]
          const classes = ['tile', `tile-${tile?.type ?? 'empty'}`]

          if (selected?.x === x && selected?.y === y) classes.push('is-selected')
          if (popping.has(key)) classes.push('is-popping')
          else if (spawning.has(key)) classes.push('is-spawned')
          else if (fall) classes.push('is-falling')
          if (moving) classes.push(swap.phase === 'back' ? 'is-swap-back' : 'is-swapping')

          return (
            <button
              key={key}
              type="button"
              className={classes.join(' ')}
              style={fall ? { ...moving, '--fall': fall } : moving}
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
