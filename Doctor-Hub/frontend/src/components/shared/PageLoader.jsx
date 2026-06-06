import LoadingSpinner from './LoadingSpinner'

const PageLoader = ({ message = 'Loading...' }) => (
  <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 p-6">
    <LoadingSpinner size="lg" />
    <p className="text-sm text-gray-500">{message}</p>
  </div>
)

export default PageLoader
