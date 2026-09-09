import { Link } from 'react-router-dom'
import { MonsterTile } from '../components/MonsterTile.jsx'
import { MONSTER_TYPES } from '../game/monsters.js'

export function HomePage() {
  return (
    <section className="hero-page">
      <p className="eyebrow">三消闯关</p>
      <h1>开心消消乐</h1>
      <p className="lede">三颗相同横排或竖排即可消除。第 2 关起会出现彩虹炸弹，和旁边一换就能炸掉周围一圈。</p>
      <div className="hero-cast">
        {MONSTER_TYPES.map((type) => (
          <span key={type} className={`tile tile-${type}`} role="img" aria-label={type}>
            <MonsterTile type={type} />
          </span>
        ))}
      </div>
      <div className="actions">
        <Link to="/levels" className="btn">
          开始游戏
        </Link>
      </div>
    </section>
  )
}
