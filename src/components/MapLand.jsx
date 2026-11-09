export function propKind(index, chapterSize) {
  if (index % chapterSize === 0) return null
  if (index % 6 !== 2) return null
  return index % 12 === 2 ? 'lollipop' : 'cloud'
}

export function propSide(pathX) {
  return pathX > 50 ? 13 : 87
}

function Lollipop() {
  return (
    <svg viewBox="0 0 70 120" aria-hidden="true">
      <rect x="32" y="44" width="6" height="70" rx="3" fill="#fff8ee" />
      <circle cx="35" cy="34" r="26" fill="#fff" />
      <circle cx="35" cy="34" r="22" fill="currentColor" />
      <path d="M35 12a22 22 0 0 1 0 44 14 14 0 0 1 0-28 8 8 0 0 1 0 16" fill="none" stroke="#fff" strokeWidth="5" />
    </svg>
  )
}

function Cloud() {
  return (
    <svg viewBox="0 0 120 64" aria-hidden="true">
      <ellipse cx="44" cy="38" rx="28" ry="18" fill="#fff" />
      <ellipse cx="72" cy="36" rx="32" ry="20" fill="#fff" />
      <ellipse cx="58" cy="24" rx="20" ry="16" fill="#fff" />
    </svg>
  )
}

function CandyTree({ big = false }) {
  return (
    <svg className={big ? 'is-big' : ''} viewBox="0 0 90 130" aria-hidden="true">
      <rect x="41" y="72" width="8" height="50" rx="4" fill="#fff4dc" />
      <circle cx="33" cy="58" r="22" fill="#ff9ec8" />
      <circle cx="58" cy="54" r="24" fill="currentColor" />
      <circle cx="45" cy="36" r="22" fill="#ff7eb3" />
      <ellipse cx="38" cy="28" rx="8" ry="5" fill="#fff" opacity="0.5" />
      <ellipse cx="45" cy="122" rx="16" ry="5" fill="rgba(120, 40, 70, 0.12)" />
    </svg>
  )
}

const DRAW = {
  lollipop: Lollipop,
  cloud: Cloud,
}

export function MapProp({ kind, color, style }) {
  const Draw = DRAW[kind]
  if (!Draw) return null
  return (
    <span className={`map-prop is-${kind}`} style={{ color, ...style }} aria-hidden="true">
      <Draw />
    </span>
  )
}

export function MapGrove({ title, color, style }) {
  return (
    <div className="map-grove" style={{ color, ...style }} aria-hidden="true">
      <CandyTree big />
      <span className="vine-sign">{title}</span>
    </div>
  )
}

export function MapSky() {
  return (
    <div className="map-sky" aria-hidden="true">
      <span className="map-sun" />
      <Cloud />
    </div>
  )
}
