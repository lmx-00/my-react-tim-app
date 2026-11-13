export const LANDS = [
  'forest',
  'valley',
  'garden',
  'orchard',
  'snow',
  'desert',
  'sea',
  'stars',
  'castle',
  'maze',
  'clouds',
  'lava',
  'bamboo',
  'moon',
  'rainbow',
  'dragon',
]

const SPARKLE = {
  stars: 'star',
  moon: 'star',
  snow: 'flake',
  lava: 'ember',
  dragon: 'ember',
}

export function landOf(chapterIndex) {
  return LANDS[((chapterIndex % LANDS.length) + LANDS.length) % LANDS.length]
}

export function propKind(index, chapterSize, land) {
  if (index % chapterSize === 0) return null
  if (index % 8 !== 3) return null
  return SPARKLE[land] ?? null
}

export function propSide(pathX) {
  return pathX > 50 ? 14 : 86
}

function Star() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path fill="#fff6c8" d="M32 6l6 18h19l-15 11 6 19-16-12-16 12 6-19L7 24h19z" />
    </svg>
  )
}

function Flake() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <g fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round">
        <path d="M32 8v48M12 20l40 24M12 44l40-24" />
      </g>
      <circle cx="32" cy="32" r="5" fill="#fff" />
    </svg>
  )
}

function Ember() {
  return (
    <svg viewBox="0 0 48 64" aria-hidden="true">
      <path fill="#ff7a3d" d="M24 4c10 14 20 22 20 36a20 20 0 1 1-40 0C4 26 14 18 24 4z" />
      <path fill="#ffd56a" d="M24 22c6 8 12 12 12 22a12 12 0 1 1-24 0c0-10 6-14 12-22z" />
    </svg>
  )
}

function Pine() {
  return (
    <svg viewBox="0 0 72 96" aria-hidden="true">
      <rect x="32" y="70" width="8" height="22" rx="2" fill="#d2a06a" />
      <path fill="#247a38" d="M10 78h52L36 46z" />
      <path fill="#3fa34c" d="M16 60h40L36 30z" />
      <path fill="#62c46a" d="M22 44h28L36 16z" />
    </svg>
  )
}

function Falls() {
  return (
    <svg viewBox="0 0 72 72" aria-hidden="true">
      <ellipse cx="36" cy="56" rx="22" ry="10" fill="#7ad4f0" />
      <ellipse cx="36" cy="54" rx="10" ry="4" fill="#eefbff" />
      <path fill="#5ec8e8" d="M30 8c5 14 8 28 6 42h10c0-14-2-28-6-42z" />
    </svg>
  )
}

function Bloom() {
  return (
    <svg viewBox="0 0 72 72" aria-hidden="true">
      <circle cx="22" cy="36" r="14" fill="#ff7eb3" />
      <circle cx="50" cy="36" r="14" fill="#ff9ecd" />
      <circle cx="36" cy="22" r="14" fill="#ffd0ea" />
      <circle cx="36" cy="48" r="13" fill="#fb7185" />
      <circle cx="36" cy="36" r="9" fill="#ffe566" />
    </svg>
  )
}

function FruitTree() {
  return (
    <svg viewBox="0 0 72 96" aria-hidden="true">
      <rect x="32" y="58" width="8" height="30" rx="3" fill="#c9a07a" />
      <circle cx="26" cy="44" r="18" fill="#3fa34c" />
      <circle cx="46" cy="40" r="20" fill="#247a38" />
      <circle cx="36" cy="28" r="14" fill="#62c46a" />
      <circle cx="24" cy="44" r="5" fill="#ff7a4a" />
      <circle cx="46" cy="36" r="5" fill="#ff9a6a" />
    </svg>
  )
}

function Peak() {
  return (
    <svg viewBox="0 0 72 80" aria-hidden="true">
      <path fill="#9ec7e8" d="M6 74h60L36 12z" />
      <path fill="#fff" d="M26 32l10-20 10 20-6 4-4-6-4 6z" />
    </svg>
  )
}

function Cactus() {
  return (
    <svg viewBox="0 0 56 90" aria-hidden="true">
      <rect x="22" y="18" width="12" height="64" rx="6" fill="#4ea24a" />
      <rect x="6" y="36" width="18" height="9" rx="4" fill="#4ea24a" />
      <rect x="32" y="46" width="16" height="9" rx="4" fill="#62c46a" />
    </svg>
  )
}

function Palm() {
  return (
    <svg viewBox="0 0 72 96" aria-hidden="true">
      <rect x="32" y="40" width="8" height="50" rx="3" fill="#d7a05a" />
      <ellipse cx="18" cy="38" rx="18" ry="8" fill="#3dba6a" transform="rotate(-28 18 38)" />
      <ellipse cx="54" cy="36" rx="18" ry="8" fill="#4fd07a" transform="rotate(32 54 36)" />
      <ellipse cx="36" cy="28" rx="16" ry="7" fill="#62e08a" />
    </svg>
  )
}

function Constellation() {
  return (
    <svg viewBox="0 0 90 80" aria-hidden="true">
      <path stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" fill="none" d="M24 30 58 16 50 52" />
      <path fill="#fff6c8" d="M20 16l3 8h9l-7 5 3 8-8-5-8 5 3-8-7-5h9z" />
      <path fill="#fff" d="M54 6l4 10h11l-9 6 3 11-9-6-9 6 3-11-9-6h11z" />
      <path fill="#d4c4ff" d="M46 44l3 7h8l-6 5 2 8-7-5-7 5 2-8-6-5h8z" />
    </svg>
  )
}

function Moon() {
  return (
    <svg viewBox="0 0 72 72" aria-hidden="true">
      <circle cx="36" cy="36" r="24" fill="#fff4c8" />
      <circle cx="28" cy="32" r="6" fill="#ead89a" opacity="0.45" />
      <circle cx="44" cy="42" r="4" fill="#ead89a" opacity="0.35" />
    </svg>
  )
}

function Turret() {
  return (
    <svg viewBox="0 0 72 96" aria-hidden="true">
      <path fill="#8b6fd4" d="M18 40h36v48H18z" />
      <path fill="#efe7ff" d="M12 32h48l-6 10H18z" />
      <rect x="26" y="52" width="8" height="12" rx="1" fill="#ffe9a8" />
      <rect x="38" y="52" width="8" height="12" rx="1" fill="#ffe9a8" />
    </svg>
  )
}

function Hedge() {
  return (
    <svg viewBox="0 0 72 48" aria-hidden="true">
      <ellipse cx="24" cy="28" rx="20" ry="14" fill="#2f6b3c" />
      <ellipse cx="46" cy="26" rx="22" ry="16" fill="#3d8a32" />
    </svg>
  )
}

function Cloud() {
  return (
    <svg viewBox="0 0 96 52" aria-hidden="true">
      <ellipse cx="34" cy="32" rx="22" ry="14" fill="#fff" />
      <ellipse cx="58" cy="30" rx="26" ry="16" fill="#fff" />
      <ellipse cx="46" cy="20" rx="16" ry="12" fill="#fff" />
    </svg>
  )
}

function Bamboo() {
  return (
    <svg viewBox="0 0 72 96" aria-hidden="true">
      <rect x="22" y="8" width="10" height="80" rx="5" fill="#6fbf4a" />
      <rect x="42" y="20" width="10" height="68" rx="5" fill="#8fd46a" />
      <rect x="20" y="36" width="14" height="4" fill="#dff8c4" />
      <rect x="40" y="50" width="14" height="4" fill="#dff8c4" />
    </svg>
  )
}

function RainbowArc() {
  return (
    <svg viewBox="0 0 90 56" aria-hidden="true">
      <path d="M10 48a35 35 0 0 1 70 0" fill="none" stroke="#ff7eb3" strokeWidth="8" />
      <path d="M18 48a27 27 0 0 1 54 0" fill="none" stroke="#ffd23f" strokeWidth="8" />
      <path d="M26 48a19 19 0 0 1 38 0" fill="none" stroke="#7ad3ff" strokeWidth="8" />
    </svg>
  )
}

const DRAW = {
  star: Star,
  flake: Flake,
  ember: Ember,
}

const GROVE = {
  forest: Pine,
  valley: Falls,
  garden: Bloom,
  orchard: FruitTree,
  snow: Peak,
  desert: Cactus,
  sea: Palm,
  stars: Constellation,
  moon: Moon,
  castle: Turret,
  maze: Hedge,
  clouds: Cloud,
  lava: Ember,
  dragon: Ember,
  bamboo: Bamboo,
  rainbow: RainbowArc,
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

export function MapGrove({ title, color, style, land = 'forest' }) {
  const Draw = GROVE[land] ?? Pine
  return (
    <div className={`map-grove is-${land}`} style={{ color, ...style }} aria-hidden="true">
      <Draw />
      <span className="vine-sign">{title}</span>
    </div>
  )
}

export function MapAtmosphere({ land }) {
  return <div className={`map-atmosphere is-${land}`} aria-hidden="true" />
}
