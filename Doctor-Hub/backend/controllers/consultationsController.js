import { createVideoRoom, getVideoRoom } from '../services/videoService.js'

export async function postVideoRoom(req, res) {
  try {
    const { userId, role } = req.auth
    const displayName = req.body.display_name || req.auth.displayName
    const data = await createVideoRoom({
      appointmentId: req.params.appointmentId,
      userId,
      role,
      displayName,
    })
    return res.json({
      success: true,
      message: 'Video room ready',
      data,
    })
  } catch (err) {
    return res.status(403).json({ success: false, message: err.message })
  }
}

export async function getVideoRoomHandler(req, res) {
  try {
    const { userId, role } = req.auth
    const data = await getVideoRoom({
      appointmentId: req.params.appointmentId,
      userId,
      role,
      displayName: req.query.display_name,
    })
    if (!data) {
      return res.json({ success: true, data: null, message: 'No video room created yet' })
    }
    return res.json({ success: true, data })
  } catch (err) {
    return res.status(403).json({ success: false, message: err.message })
  }
}
