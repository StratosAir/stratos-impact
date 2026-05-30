import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/layouts/AppLayout'
import Dashboard from '@/pages/Dashboard'
import Portfolio from '@/pages/Portfolio'
import MeasureDetail from '@/pages/MeasureDetail'
import IdeationAssistant from '@/pages/IdeationAssistant'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="portfolio/:id" element={<MeasureDetail />} />
        <Route path="ideation" element={<IdeationAssistant />} />
      </Route>
    </Routes>
  )
}
