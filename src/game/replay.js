const cellKey = (y, x) => `${y}-${x}`

function cloneCells(cells) {
  return cells.map((row) => row.slice())
}

// 把服务端的事件流拆成一帧一帧：pop 帧演消除，settle 帧演下落和补充。
// 这里只是重放，最终棋盘仍然以服务端返回的为准。
export function buildFrames(startCells, events) {
  const frames = []
  let cells = cloneCells(startCells)
  let falling = null
  let spawning = new Set()

  function flush() {
    if (!falling) return
    frames.push({
      kind: 'settle',
      cells: cloneCells(cells),
      falling: Object.fromEntries(falling),
      spawning: [...spawning],
    })
    falling = null
    spawning = new Set()
  }

  for (const event of events) {
    switch (event.type) {
      // 交换本身由滑动动画表现，这里只把棋盘对齐
      case 'swap': {
        const [y1, x1] = event.from
        const [y2, x2] = event.to
        const keep = cells[y1][x1]
        cells[y1][x1] = cells[y2][x2]
        cells[y2][x2] = keep
        break
      }

      case 'match':
      case 'rainbow': {
        flush()
        frames.push({
          kind: 'pop',
          cells: cloneCells(cells),
          popping: event.cells.map(([y, x]) => cellKey(y, x)),
          wave: event.wave ?? 1,
          score: event.score ?? 0,
        })
        for (const [y, x] of event.cells) {
          if (cells[y]) cells[y][x] = null
        }
        break
      }

      case 'spawnSpecial': {
        falling ??= new Map()
        for (const item of event.tiles) {
          const [y, x] = item.at
          cells[y][x] = item.tile
          spawning.add(cellKey(y, x))
        }
        break
      }

      case 'drop': {
        falling ??= new Map()
        for (const move of event.moves) {
          const [fromY, fromX] = move.from
          const [toY, toX] = move.to
          cells[toY][toX] = cells[fromY][fromX]
          cells[fromY][fromX] = null
          falling.set(cellKey(toY, toX), toY - fromY)
          // 刚生成的特殊块也会往下掉，标记跟着走
          if (spawning.delete(cellKey(fromY, fromX))) spawning.add(cellKey(toY, toX))
        }
        break
      }

      case 'fill': {
        falling ??= new Map()
        const perColumn = new Map()
        for (const item of event.cells) {
          const col = item.at[1]
          perColumn.set(col, (perColumn.get(col) ?? 0) + 1)
        }
        for (const item of event.cells) {
          const [y, x] = item.at
          cells[y][x] = item.tile
          // 一列新块整体从棋盘上方落进来
          falling.set(cellKey(y, x), perColumn.get(x))
        }
        break
      }

      case 'shuffle': {
        flush()
        cells = cloneCells(event.board.cells)
        frames.push({ kind: 'settle', cells: cloneCells(cells), falling: {}, spawning: [] })
        break
      }

      default:
        break
    }
  }

  flush()
  return frames
}
