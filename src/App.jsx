import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.jsx'
import { GuestOnly, RequireAuth } from './auth/RequireAuth.jsx'
import { Layout } from './components/Layout.jsx'
import { HomePage } from './pages/Home.jsx'
import { LevelsPage } from './pages/Levels.jsx'
import { LoginPage } from './pages/Login.jsx'
import { PlayPage } from './pages/Play.jsx'
import { ProfilePage } from './pages/Profile.jsx'
import { RecordsPage } from './pages/Records.jsx'
import { RegisterPage } from './pages/Register.jsx'
import { ResultPage } from './pages/Result.jsx'

// 换关卡就整块重挂载，对局状态不用自己手动清
function PlayRoute() {
  const { levelId } = useParams()
  return <PlayPage key={levelId} />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestOnly>
                  <LoginPage />
                </GuestOnly>
              }
            />
            <Route
              path="/register"
              element={
                <GuestOnly>
                  <RegisterPage />
                </GuestOnly>
              }
            />
            <Route element={<RequireAuth />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/levels" element={<LevelsPage />} />
              <Route path="/play/:levelId" element={<PlayRoute />} />
              <Route path="/result/:sessionId" element={<ResultPage />} />
              <Route path="/records" element={<RecordsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  )
}
