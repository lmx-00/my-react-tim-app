function Gumdrop({ className }) {
  return (
    <svg className={className} viewBox="0 0 80 70" aria-hidden="true">
      <ellipse cx="40" cy="58" rx="26" ry="8" fill="rgba(120, 40, 70, 0.12)" />
      <path d="M16 40c0-16 10-28 24-28s24 12 24 28c0 10-8 18-24 18S16 50 16 40z" fill="currentColor" />
      <ellipse cx="32" cy="28" rx="8" ry="5" fill="#fff" opacity="0.55" />
    </svg>
  )
}

function Lollipop({ className }) {
  return (
    <svg className={className} viewBox="0 0 70 120" aria-hidden="true">
      <rect x="32" y="42" width="6" height="70" rx="3" fill="#fff" />
      <circle cx="35" cy="34" r="26" fill="#fff" />
      <circle cx="35" cy="34" r="22" fill="currentColor" />
      <path d="M35 12a22 22 0 0 1 0 44 14 14 0 0 1 0-28 8 8 0 0 1 0 16" fill="none" stroke="#fff" strokeWidth="5" />
    </svg>
  )
}

function CandyCane({ className }) {
  return (
    <svg className={className} viewBox="0 0 70 120" aria-hidden="true">
      <path
        d="M48 18c0-8-8-14-18-14S14 12 14 24v78"
        fill="none"
        stroke="#fff"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d="M48 18c0-8-8-14-18-14S14 12 14 24v78"
        fill="none"
        stroke="currentColor"
        strokeWidth="16"
        strokeLinecap="round"
        strokeDasharray="10 10"
      />
    </svg>
  )
}

export function Landscape() {
  return (
    <div className="landscape" aria-hidden="true">
      <span className="candy-glow" />
      <Gumdrop className="candy gumdrop gumdrop-a" />
      <Gumdrop className="candy gumdrop gumdrop-b" />
      <Lollipop className="candy lollipop lollipop-a" />
      <Lollipop className="candy lollipop lollipop-b" />
      <CandyCane className="candy cane cane-a" />
      <span className="candy-hill candy-hill-left" />
      <span className="candy-hill candy-hill-right" />
    </div>
  )
}
