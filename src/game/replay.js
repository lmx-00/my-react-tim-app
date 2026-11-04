const cellKey = (y, x) => `${y}-${x}`

function specialBanner(tile) {
  if (tile.type === 'rainbow') return '五连 · 彩虹鸟'
  if (tile.type === 'bomb') return '拐角 · 炸弹'
  if (tile.type === 'rocket') return tile.dir === 'row' ? '四连 · 横火箭' : '四连 · 竖火箭'
  return ''
}

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
        const shown = cloneCells(cells)
        const removed = []
        for (const [y, x] of event.cells) {
          const tile = cells[y]?.[x]
          if (tile?.ice > 1) {
            const cracked = { ...tile, ice: tile.ice - 1 }
            shown[y][x] = cracked
            cells[y][x] = cracked
          } else {
            removed.push(cellKey(y, x))
            if (cells[y]) cells[y][x] = null
          }
        }
        frames.push({
          kind: 'pop',
          cells: shown,
          popping: removed,
          wave: event.wave ?? 1,
          score: event.score ?? 0,
          effect: event.effect ?? (event.type === 'rainbow' ? 'color' : 'match'),
        })
        break
      }

      case 'spawnSpecial': {
        falling ??= new Map()
        const last = frames[frames.length - 1]
        const banner = event.tiles.map((item) => specialBanner(item.tile)).filter(Boolean).join('  ')
        if (last?.kind === 'pop' && banner) {
          last.banner = banner
          if (!last.effect || last.effect === 'match') {
            const tile = event.tiles[0].tile
            last.effect = tile.type === 'rainbow' ? 'color' : tile.type === 'bomb' ? 'bomb' : 'line'
          }
          const shown = new Set()
          for (const item of event.tiles) {
            const [y, x] = item.at
            shown.add(cellKey(y, x))
            if (last.cells[y]) last.cells[y][x] = item.tile
          }
          last.popping = last.popping.filter((key) => !shown.has(key))
        }
        for (const item of event.tiles) {
          const [y, x] = item.at
          cells[y][x] = item.tile
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

      case 'crate': {
        flush()
        for (const [y, x] of event.cells) {
          const tile = cells[y]?.[x]
          if (!tile) continue
          if ((tile.layers ?? 1) > 1) cells[y][x] = { ...tile, layers: tile.layers - 1 }
          else cells[y][x] = null
        }
        frames.push({ kind: 'settle', cells: cloneCells(cells), falling: {}, spawning: [] })
        break
      }
      case 'ice':
      case 'snow': {
        flush()
        for (const [y, x] of event.cells) {
          const tile = cells[y]?.[x]
          if (!tile) continue
          if (tile.ice > 1) cells[y][x] = { ...tile, ice: tile.ice - 1 }
          else cells[y][x] = { ...tile, ice: 0, snow: false }
        }
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
