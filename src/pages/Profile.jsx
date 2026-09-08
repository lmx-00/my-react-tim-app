export function ProfilePage() {
  return (
    <section className="stack">
      <h1>我的</h1>
      <p>下一步在这里请求 `GET /api/me` 和 `GET /api/stats`。</p>
      <ul className="stat-list">
        <li>总场次 —</li>
        <li>胜场 —</li>
        <li>最高关卡 —</li>
      </ul>
    </section>
  )
}
