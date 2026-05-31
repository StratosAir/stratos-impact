import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import TopNav from '@/components/TopNav'
import { DataFreezeProvider } from '@/contexts/DataFreezeContext'

export default function AppLayout() {
  return (
    <DataFreezeProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <TopNav />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </DataFreezeProvider>
  )
}
