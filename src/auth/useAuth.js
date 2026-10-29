import { createContext, useContext } from 'react'

// 和 AuthProvider 分开放：组件文件只导出组件，fast refresh 才能正常工作
export const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth 必须在 AuthProvider 内使用')
  }
  return ctx
}
