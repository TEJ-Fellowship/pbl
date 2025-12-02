import { clsx } from 'clsx'

interface DashboardProps {
  tab?: string
}

const statusCounts = {
  intake: { count: 12, label: 'New Prescriptions' },
  validation: { count: 5, label: 'Being Validated' },
  enrollment: { count: 8, label: 'Awaiting Enrollment' },
  routing: { count: 3, label: 'Ready for Routing' },
  insurance: { count: 2, label: 'Processing Insurance' },
  payment: { count: 6, label: 'Awaiting Payment' },
  fulfillment: { count: 4, label: 'Being Fulfilled' },
  completed: { count: 156, label: 'Completed' },
}

export default function Dashboard({ tab }: DashboardProps) {
  if (!tab) {
    // Overview page
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-100">
            Operations Dashboard
          </h1>
          <p className="text-gray-400 mt-1">
            Monitor prescription fulfillment workflow
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(statusCounts).map(([key, value]) => (
            <div
              key={key}
              className="card p-5 card-hover cursor-pointer"
            >
              <div className="text-3xl font-display font-bold text-gray-100">
                {value.count}
              </div>
              <div className="text-sm text-gray-400 mt-1 capitalize">
                {value.label}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <h2 className="text-lg font-display font-semibold text-gray-100 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {[
              { time: '2 min ago', action: 'Prescription received', patient: 'John Smith', status: 'received' },
              { time: '5 min ago', action: 'Validation completed', patient: 'Maria Garcia', status: 'validated' },
              { time: '12 min ago', action: 'Payment received', patient: 'James Wilson', status: 'paid' },
              { time: '18 min ago', action: 'Shipped', patient: 'Emily Chen', status: 'shipped' },
              { time: '25 min ago', action: 'Delivered', patient: 'Robert Brown', status: 'delivered' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 border-b border-gray-700/50 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <span className={clsx('status-badge', `status-${item.status}`)}>
                    {item.status}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-200">
                      {item.action}
                    </div>
                    <div className="text-xs text-gray-500">{item.patient}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">{item.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Tab-specific view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-100 capitalize">
          {tab === 'audit' ? 'Audit Log' : tab}
        </h1>
        <p className="text-gray-400 mt-1">
          {getTabDescription(tab)}
        </p>
      </div>

      {/* Placeholder for tab content */}
      <div className="card p-12 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-xl font-display font-semibold text-gray-200">
          Coming in Sprint 1
        </h2>
        <p className="text-gray-400 mt-2 max-w-md mx-auto">
          This section will display {tab} prescriptions with detailed views and actions.
        </p>
      </div>
    </div>
  )
}

function getTabDescription(tab: string): string {
  const descriptions: Record<string, string> = {
    intake: 'Newly received prescriptions awaiting validation',
    validation: 'Prescriptions being validated or with validation issues',
    enrollment: 'Prescriptions awaiting patient enrollment',
    routing: 'Ready for pharmacy selection with filtered recommendations',
    insurance: 'Awaiting or processing insurance adjudication',
    payment: 'Awaiting patient payment',
    fulfillment: 'Paid prescriptions being filled and shipped',
    completed: 'Delivered prescriptions',
    audit: 'Complete audit trail of all system actions',
  }
  return descriptions[tab] || ''
}

