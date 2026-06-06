import { getDashboard } from '../services/dashboardService.js'

export async function fetchDashboard(req, res) {
  try {
    const { userId, role } = req.auth
    const data = await getDashboard({ userId, role })
    const body = { success: true, data }
    if (data.dashData) body.dashData = data.dashData
    res.json(body)
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}
