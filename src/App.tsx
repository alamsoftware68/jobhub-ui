import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import JobDetailPage from './pages/JobDetailPage'
import JobsPage from './pages/JobsPage'
import ProfilePage from './pages/ProfilePage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<JobsPage />} />
        <Route path="saved" element={<JobsPage savedOnly />} />
        <Route path="jobs/:id" element={<JobDetailPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
