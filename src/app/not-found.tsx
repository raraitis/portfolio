import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-6xl font-light text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-medium text-gray-600 mb-8">Page Not Found</h2>
        <p className="text-gray-500 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-700 transition-colors"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}
