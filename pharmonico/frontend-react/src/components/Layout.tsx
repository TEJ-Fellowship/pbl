import { Outlet, NavLink } from 'react-router-dom'
import { clsx } from 'clsx'

const navItems = [
  { path: '/', label: 'Overview', icon: '📊' },
  { path: '/intake', label: 'Intake', icon: '📥' },
  { path: '/validation', label: 'Validation', icon: '✅' },
  { path: '/enrollment', label: 'Enrollment', icon: '📝' },
  { path: '/routing', label: 'Routing', icon: '🏥' },
  { path: '/insurance', label: 'Insurance', icon: '💳' },
  { path: '/payment', label: 'Payment', icon: '💰' },
  { path: '/fulfillment', label: 'Fulfillment', icon: '📦' },
  { path: '/completed', label: 'Completed', icon: '✨' },
  { path: '/audit', label: 'Audit Log', icon: '📋' },
]

export default function Layout() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800/50 border-r border-gray-700/50 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-700/50">
          <span className="text-2xl font-display font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
            Pharmonico
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-700/50'
                )
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700/50">
          <div className="text-xs text-gray-500 text-center">
            Prescription Fulfillment System
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-gray-800/30 border-b border-gray-700/50 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <input
              type="search"
              placeholder="Search prescriptions, patients..."
              className="w-80 bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-gray-100 hover:bg-gray-700/50 rounded-lg transition-colors">
              🔔
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-sm font-bold">
                OP
              </div>
              <span className="text-sm text-gray-300">Ops Team</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

