import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import EnrollmentPortal from './pages/EnrollmentPortal'

function App() {
  return (
    <Routes>
      {/* Operations Dashboard Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="intake" element={<Dashboard tab="intake" />} />
        <Route path="validation" element={<Dashboard tab="validation" />} />
        <Route path="enrollment" element={<Dashboard tab="enrollment" />} />
        <Route path="routing" element={<Dashboard tab="routing" />} />
        <Route path="insurance" element={<Dashboard tab="insurance" />} />
        <Route path="payment" element={<Dashboard tab="payment" />} />
        <Route path="fulfillment" element={<Dashboard tab="fulfillment" />} />
        <Route path="completed" element={<Dashboard tab="completed" />} />
        <Route path="audit" element={<Dashboard tab="audit" />} />
      </Route>

      {/* Patient Enrollment Portal Routes */}
      <Route path="/enroll/:token" element={<EnrollmentPortal />} />
    </Routes>
  )
}

export default App

