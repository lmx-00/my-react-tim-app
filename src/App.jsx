import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.jsx'
import { GuestOnly, RequireAuth } from './auth/RequireAuth.jsx'
import { Layout } from './components/Layout.jsx'
import { AdminPage } from './pages/Admin.jsx'
import { HomePage } from './pages/Home.jsx'
import { LevelLoadPage } from './pages/LevelLoad.jsx'
import { LevelsPage } from './pages/Levels.jsx'
import { LoginPage } from './pages/Login.jsx'
import { PasswordPage } from './pages/Password.jsx'
import { BindPage } from './pages/Bind.jsx'
import { PlayPage } from './pages/Play.jsx'
import { ProfilePage } from './pages/Profile.jsx'
import { RankPage } from './pages/Rank.jsx'
import { RecordsPage } from './pages/Records.jsx'
import { RegisterPage } from './pages/Register.jsx'
import { ResultPage } from './pages/Result.jsx'
import { ShopPage } from './pages/Shop.jsx'
import { MailPage } from './pages/Mail.jsx'
import { BagPage } from './pages/Bag.jsx'
import { ActivityPage } from './pages/Activity.jsx'
import { SettingsPage } from './pages/Settings.jsx'
import { AlbumPage } from './pages/Album.jsx'
import { CommunityPage } from './pages/Community.jsx'
import { AgreementPage } from './pages/Agreement.jsx'
import { PrivacyPage } from './pages/Privacy.jsx'

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
            <Route path="/agreement" element={<AgreementPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/levels" element={<LevelsPage />} />
              <Route path="/load/:levelId" element={<LevelLoadPage />} />
              <Route path="/play/:levelId" element={<PlayRoute />} />
              <Route path="/result/:sessionId" element={<ResultPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/bag" element={<BagPage />} />
              <Route path="/album" element={<AlbumPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/mail" element={<MailPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/records" element={<RecordsPage />} />
              <Route path="/rank" element={<RankPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/password" element={<PasswordPage />} />
              <Route path="/profile/bind" element={<BindPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  )
}
