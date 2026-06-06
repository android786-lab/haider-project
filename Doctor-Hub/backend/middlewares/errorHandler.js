export function notFoundHandler(_req, res) {
  res.status(404).json({ success: false, message: 'Route not found' })
}

export function errorHandler(err, req, res, _next) {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'Origin not allowed' })
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large (max 5 MB)' })
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ success: false, message: 'Too many files uploaded' })
  }

  if (err.message?.includes('Only image files')) {
    return res.status(400).json({ success: false, message: err.message })
  }

  console.error('Unhandled error:', err.message)
  const status = err.status || err.statusCode || 500
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : err.message || 'Internal server error'

  res.status(status).json({ success: false, message })
}
