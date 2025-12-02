import { useParams } from 'react-router-dom'

export default function EnrollmentPortal() {
  const { token } = useParams()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
            Pharmonico
          </h1>
          <p className="text-gray-400 mt-2">Patient Enrollment Portal</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-display font-semibold text-gray-100">
              Complete Your Enrollment
            </h2>
            <p className="text-gray-400 mt-2">
              Token: <code className="text-xs bg-gray-700 px-2 py-1 rounded">{token}</code>
            </p>
          </div>

          <div className="mt-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm text-center">
              🚧 Enrollment form will be implemented in Sprint 2
            </p>
          </div>

          <div className="mt-8 space-y-4 text-sm text-gray-400">
            <p>You will be asked to provide:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Insurance information (carrier, member ID, group number)</li>
              <li>Optional: Insurance card images</li>
              <li>Manufacturer coupon enrollment</li>
              <li>HIPAA consent and electronic signature</li>
            </ul>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          This link expires in 72 hours. If you need assistance, contact support.
        </p>
      </div>
    </div>
  )
}

