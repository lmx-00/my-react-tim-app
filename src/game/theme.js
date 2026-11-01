export function applyTheme(theme) {
  const name = theme === 'forest' ? 'forest' : 'candy'
  document.documentElement.dataset.theme = name
  let meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', name === 'forest' ? '#49b7f5' : '#ffc4e4')
}
