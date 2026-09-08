function Cloud({ className }) {
  return (
    <svg className={className} viewBox="0 0 160 80" fill="none" aria-hidden="true">
      <ellipse cx="52" cy="50" rx="36" ry="22" fill="#fff" />
      <ellipse cx="88" cy="36" rx="34" ry="28" fill="#fff" />
      <ellipse cx="122" cy="50" rx="32" ry="20" fill="#fff" />
      <ellipse cx="80" cy="54" rx="48" ry="18" fill="#fff" />
    </svg>
  )
}

function Bear() {
  return (
    <svg viewBox="0 0 80 78" className="critter critter-bear">
      <circle cx="18" cy="18" r="11" fill="#c9844a" />
      <circle cx="62" cy="18" r="11" fill="#c9844a" />
      <circle cx="18" cy="18" r="6" fill="#f3d2b0" />
      <circle cx="62" cy="18" r="6" fill="#f3d2b0" />
      <ellipse cx="40" cy="48" rx="28" ry="24" fill="#d39255" />
      <circle cx="40" cy="32" r="22" fill="#d39255" />
      <ellipse cx="40" cy="40" rx="12" ry="9" fill="#f7ddc4" />
      <ellipse cx="40" cy="44" rx="7" ry="4" fill="#b56a3c" />
      <circle cx="32" cy="28" r="3.2" fill="#3b2a1a" />
      <circle cx="48" cy="28" r="3.2" fill="#3b2a1a" />
      <circle cx="33" cy="27" r="1" fill="#fff" />
      <circle cx="49" cy="27" r="1" fill="#fff" />
    </svg>
  )
}

function Chick() {
  return (
    <svg viewBox="0 0 64 64" className="critter critter-chick">
      <ellipse cx="32" cy="38" rx="18" ry="16" fill="#ffe066" />
      <circle cx="32" cy="24" r="13" fill="#ffe566" />
      <polygon points="32,18 36,8 28,18" fill="#ff9f43" />
      <polygon points="32,26 42,30 32,33" fill="#ff9f43" />
      <circle cx="28" cy="22" r="2.4" fill="#3b2a1a" />
      <ellipse cx="18" cy="38" rx="6" ry="3" fill="#ffd43b" />
      <ellipse cx="46" cy="38" rx="6" ry="3" fill="#ffd43b" />
    </svg>
  )
}

function Frog() {
  return (
    <svg viewBox="0 0 72 60" className="critter critter-frog">
      <ellipse cx="36" cy="38" rx="24" ry="16" fill="#6fde5b" />
      <circle cx="22" cy="20" r="10" fill="#6fde5b" />
      <circle cx="50" cy="20" r="10" fill="#6fde5b" />
      <circle cx="22" cy="20" r="5.5" fill="#fff" />
      <circle cx="50" cy="20" r="5.5" fill="#fff" />
      <circle cx="23" cy="21" r="2.6" fill="#2a4a1a" className="pupil" />
      <circle cx="51" cy="21" r="2.6" fill="#2a4a1a" className="pupil" />
      <ellipse cx="36" cy="42" rx="8" ry="4" fill="#4cbf45" />
      <ellipse cx="14" cy="48" rx="8" ry="5" fill="#57c94c" />
      <ellipse cx="58" cy="48" rx="8" ry="5" fill="#57c94c" />
    </svg>
  )
}

function Cat() {
  return (
    <svg viewBox="0 0 72 70" className="critter critter-cat">
      <polygon points="14,24 22,6 30,22" fill="#f4a261" />
      <polygon points="42,22 50,6 58,24" fill="#f4a261" />
      <polygon points="18,22 22,12 26,22" fill="#ffd6a5" />
      <polygon points="46,22 50,12 54,22" fill="#ffd6a5" />
      <ellipse cx="36" cy="46" rx="22" ry="18" fill="#f4a261" />
      <circle cx="36" cy="30" r="18" fill="#f4a261" />
      <ellipse cx="36" cy="36" rx="8" ry="6" fill="#ffe8cc" />
      <polygon points="36,34 32,38 40,38" fill="#e76f51" />
      <circle cx="29" cy="28" r="2.6" fill="#3b2a1a" />
      <circle cx="43" cy="28" r="2.6" fill="#3b2a1a" />
      <path d="M58 42 Q72 28 64 18" stroke="#f4a261" strokeWidth="6" fill="none" strokeLinecap="round" className="tail" />
    </svg>
  )
}

function Fox() {
  return (
    <svg viewBox="0 0 76 70" className="critter critter-fox">
      <polygon points="16,26 22,4 32,22" fill="#ff8c42" />
      <polygon points="44,22 54,4 60,26" fill="#ff8c42" />
      <ellipse cx="38" cy="48" rx="22" ry="16" fill="#ff8c42" />
      <circle cx="38" cy="30" r="18" fill="#ff8c42" />
      <ellipse cx="38" cy="38" rx="10" ry="8" fill="#fff7ed" />
      <polygon points="38,34 33,40 43,40" fill="#222" />
      <circle cx="31" cy="26" r="2.5" fill="#222" />
      <circle cx="45" cy="26" r="2.5" fill="#222" />
      <ellipse cx="18" cy="52" rx="7" ry="5" fill="#fff7ed" />
      <ellipse cx="58" cy="52" rx="7" ry="5" fill="#fff7ed" />
    </svg>
  )
}

function Owl() {
  return (
    <svg viewBox="0 0 70 72" className="critter critter-owl">
      <ellipse cx="35" cy="44" rx="22" ry="20" fill="#c08457" />
      <circle cx="35" cy="28" r="18" fill="#d4a574" />
      <polygon points="18,16 24,4 30,18" fill="#c08457" />
      <polygon points="40,18 46,4 52,16" fill="#c08457" />
      <circle cx="26" cy="28" r="8" fill="#fff" />
      <circle cx="44" cy="28" r="8" fill="#fff" />
      <circle cx="26" cy="29" r="3.2" fill="#2b2118" className="pupil" />
      <circle cx="44" cy="29" r="3.2" fill="#2b2118" className="pupil" />
      <polygon points="35,34 30,40 40,40" fill="#f4a261" />
    </svg>
  )
}

export function Landscape() {
  return (
    <div className="landscape" aria-hidden="true">
      <span className="sun" />
      <Cloud className="cloud cloud-a" />
      <Cloud className="cloud cloud-b" />
      <Cloud className="cloud cloud-c" />
      <Cloud className="cloud cloud-d" />
      <span className="hill hill-left" />
      <span className="hill hill-right" />
      <div className="meadow">
        <Bear />
        <Chick />
        <Frog />
        <Fox />
        <Cat />
        <Owl />
      </div>
    </div>
  )
}
