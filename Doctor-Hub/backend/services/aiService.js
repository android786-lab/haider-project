import { requireSupabase } from '../config/supabaseClient.js'
import { SYMPTOM_RULES, DISCLAIMER } from '../data/symptomKnowledge.js'

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
}

function ruleScore(tokens, rule) {
  let hits = 0
  const text = tokens.join(' ')
  for (const kw of rule.keywords) {
    if (kw.includes(' ') && text.includes(kw)) {
      hits += 2
    } else if (tokens.some((t) => kw.includes(t) || t.includes(kw.split(' ')[0]))) {
      hits += 1
    }
  }
  if (hits === 0) return 0
  return Math.min(1, (hits / 3) * rule.confidence)
}

async function getPlatformDiseases() {
  const supabase = requireSupabase()
  const { data, error } = await supabase.from('doctors').select('diseases, treatment')
  if (error) return []

  const map = new Map()
  for (const row of data || []) {
    for (const d of row.diseases || []) {
      const key = d.toLowerCase()
      if (!map.has(key)) {
        map.set(key, { disease: d, treatment_type: row.treatment, in_platform: true })
      }
    }
  }
  return [...map.values()]
}

function predictFromRules(symptomsText) {
  const tokens = tokenize(symptomsText)
  const scored = []

  for (const rule of SYMPTOM_RULES) {
    const score = ruleScore(tokens, rule)
    if (score <= 0) continue
    for (const disease of rule.diseases) {
      scored.push({
        disease,
        confidence: Math.round(score * 100) / 100,
        treatment_type: rule.treatment_type,
        rationale: rule.note || 'Matched reported symptoms.',
        source: 'rules',
      })
    }
  }

  const byDisease = new Map()
  for (const item of scored) {
    const existing = byDisease.get(item.disease)
    if (!existing || item.confidence > existing.confidence) {
      byDisease.set(item.disease, item)
    }
  }

  return [...byDisease.values()].sort((a, b) => b.confidence - a.confidence)
}

async function predictFromExternalAi(symptomsText) {
  const apiKey = process.env.AI_API_KEY
  const baseUrl = (process.env.AI_API_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = process.env.AI_MODEL || 'gpt-4o-mini'

  if (!apiKey) return null

  const platformDiseases = await getPlatformDiseases()
  const diseaseList = platformDiseases.map((d) => d.disease).join(', ')

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You assist with possible condition names for triage only. Return JSON: {"predictions":[{"disease":"string","confidence":0.0-1.0,"treatment_type":"allopathic|homeopathic|herbal","rationale":"short"}]}. Prefer diseases from this platform list when relevant: ${diseaseList}. Max 5 predictions. Not a diagnosis.`,
        },
        { role: 'user', content: `Symptoms: ${symptomsText}` },
      ],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`AI provider error: ${response.status} ${errText.slice(0, 120)}`)
  }

  const json = await response.json()
  const content = json.choices?.[0]?.message?.content
  if (!content) return null

  const parsed = JSON.parse(content)
  return (parsed.predictions || []).map((p) => ({
    disease: p.disease,
    confidence: Math.min(1, Math.max(0, Number(p.confidence) || 0.5)),
    treatment_type: p.treatment_type || 'allopathic',
    rationale: p.rationale || 'AI model suggestion',
    source: 'external',
  }))
}

export async function predictDiseases({ symptoms, age, duration_days }) {
  const text = symptoms?.trim()
  if (!text || text.length < 3) {
    throw new Error('Please describe your symptoms (at least 3 characters)')
  }

  let predictions = []
  let mode = 'rules'

  try {
    const external = await predictFromExternalAi(text)
    if (external?.length) {
      predictions = external
      mode = 'external'
    }
  } catch (err) {
    console.warn('External AI unavailable, using rules:', err.message)
  }

  if (predictions.length === 0) {
    predictions = predictFromRules(text)
    mode = 'rules'
  }

  const platform = await getPlatformDiseases()
  const lowerSymptoms = text.toLowerCase()
  for (const p of platform) {
    if (lowerSymptoms.includes(p.disease.toLowerCase())) {
      const exists = predictions.some(
        (x) => x.disease.toLowerCase() === p.disease.toLowerCase()
      )
      if (!exists) {
        predictions.push({
          disease: p.disease,
          confidence: 0.9,
          treatment_type: p.treatment_type,
          rationale: 'You mentioned this condition directly.',
          source: 'rules',
        })
      }
    }
  }
  predictions.sort((a, b) => b.confidence - a.confidence)
  const platformByName = new Map(platform.map((p) => [p.disease.toLowerCase(), p]))

  predictions = predictions.slice(0, 5).map((p) => {
    const match = platformByName.get(p.disease?.toLowerCase())
    return {
      ...p,
      confidence: Math.round(p.confidence * 100) / 100,
      treatment_type: p.treatment_type || match?.treatment_type || 'allopathic',
      doctors_available: !!match,
    }
  })

  if (predictions.length === 0) {
    predictions = [
      {
        disease: 'General consultation',
        confidence: 0.4,
        treatment_type: 'allopathic',
        rationale:
          'Symptoms were unclear — book a general physician or search by condition on Find doctors.',
        doctors_available: true,
        source: 'fallback',
      },
    ]
  }

  return {
    mode,
    disclaimer: DISCLAIMER,
    context: {
      age: age || null,
      duration_days: duration_days || null,
    },
    predictions,
  }
}
