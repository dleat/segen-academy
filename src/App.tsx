import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import { AuthProvider } from './lib/auth'
import { I18nProvider } from './lib/i18n'
import Admin from './pages/Admin'
import { ForgotPassword, Login, RequireAuth, ResetPassword, Signup } from './pages/Auth'
import Buy from './pages/Buy'
import CoursePage from './pages/CoursePage'
import Courses from './pages/Courses'
import Home from './pages/Home'
import Learn from './pages/Learn'
import MyCourses from './pages/MyCourses'
import NotFound from './pages/NotFound'
import EditorApply from './pages/jobs/EditorApply'
import JobPage from './pages/jobs/JobPage'
import JobsHome from './pages/jobs/JobsHome'
import JobsLayout from './pages/jobs/JobsLayout'
import MyJobs from './pages/jobs/MyJobs'
import PostJob from './pages/jobs/PostJob'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="courses" element={<Courses />} />
              <Route path="courses/:courseId" element={<CoursePage />} />
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="buy/:offerId" element={<Buy />} />
              <Route path="my" element={<RequireAuth><MyCourses /></RequireAuth>} />
              <Route path="learn/:courseId" element={<RequireAuth><Learn /></RequireAuth>} />
              <Route path="admin" element={<RequireAuth adminOnly><Admin /></RequireAuth>} />
              <Route path="jobs" element={<JobsLayout />}>
                <Route index element={<JobsHome />} />
                <Route path="new" element={<RequireAuth><PostJob /></RequireAuth>} />
                <Route path="mine" element={<RequireAuth><MyJobs /></RequireAuth>} />
                <Route path="editor" element={<RequireAuth><EditorApply /></RequireAuth>} />
                <Route path=":jobId" element={<RequireAuth><JobPage /></RequireAuth>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  )
}
