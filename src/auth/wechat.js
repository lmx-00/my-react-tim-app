export function rememberWechat(search) {
  const params = new URLSearchParams(search)
  const openid = params.get('openid')
  const nickname = params.get('wxNickname')
  const avatar = params.get('wxAvatar')
  if (openid) sessionStorage.setItem('wx-openid', openid)
  if (nickname) sessionStorage.setItem('wx-nickname', nickname)
  if (avatar) sessionStorage.setItem('wx-avatar', avatar)
}

export function storedWechat() {
  return {
    openid: sessionStorage.getItem('wx-openid') || '',
    nickname: sessionStorage.getItem('wx-nickname') || '',
    avatarUrl: sessionStorage.getItem('wx-avatar') || '',
  }
}
