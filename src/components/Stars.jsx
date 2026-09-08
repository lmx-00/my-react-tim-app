export function Stars({ value = 0 }) {
  return (
    <span className="stars" aria-label={`${value} 星`}>
      {[1, 2, 3].map((star) => (
        <span key={star} className={star <= value ? 'star on' : 'star'}>
          ★
        </span>
      ))}
    </span>
  )
}
