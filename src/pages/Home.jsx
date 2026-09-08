import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <section className="hero-page">
      <p className="eyebrow">三消闯关</p>
      <h1>开心消消乐</h1>
      <p className="lede">三颗相同横排或竖排即可消除。登录后从第 1 关开始，通关解锁下一关。</p>
      <div className="actions">
        <Link to="/levels" className="btn">
          开始游戏
        </Link>
      </div>
    </section>
  )
}
