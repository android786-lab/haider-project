import { predictDiseases } from '../services/aiService.js'

export async function predict(req, res) {
  try {
    const { symptoms, age, duration_days } = req.body
    const data = await predictDiseases({ symptoms, age, duration_days })
    return res.json({ success: true, data })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}
