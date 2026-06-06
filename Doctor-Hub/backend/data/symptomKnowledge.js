/**
 * Symptom → disease hints aligned with Doctor Hub seed / doctor search.
 * Not a clinical diagnosis — triage suggestions only.
 */
export const SYMPTOM_RULES = [
  {
    keywords: ['thirst', 'urination', 'frequent urine', 'glucose', 'blood sugar', 'sugar', 'polyuria'],
    diseases: ['Diabetes'],
    treatment_type: 'allopathic',
    confidence: 0.82,
    note: 'Blood sugar–related symptoms often need allopathic evaluation.',
  },
  {
    keywords: ['blood pressure', 'hypertension', 'bp high', 'headache morning', 'dizzy'],
    diseases: ['Hypertension'],
    treatment_type: 'allopathic',
    confidence: 0.78,
  },
  {
    keywords: ['fever', 'temperature', 'chills', 'body ache', 'flu', 'cough cold'],
    diseases: ['Fever'],
    treatment_type: 'allopathic',
    confidence: 0.8,
  },
  {
    keywords: ['rash', 'itching', 'hives', 'skin allergy', 'eczema', 'red skin'],
    diseases: ['Skin Allergy'],
    treatment_type: 'homeopathic',
    confidence: 0.76,
  },
  {
    keywords: ['migraine', 'severe headache', 'head pain', 'aura', 'light sensitivity'],
    diseases: ['Migraine'],
    treatment_type: 'homeopathic',
    confidence: 0.74,
  },
  {
    keywords: ['anxiety', 'stress', 'panic', 'worry', 'restless', 'nervous'],
    diseases: ['Anxiety'],
    treatment_type: 'homeopathic',
    confidence: 0.7,
  },
  {
    keywords: ['stomach', 'digestion', 'bloating', 'nausea', 'diarrhea', 'constipation', 'acid'],
    diseases: ['Digestive Issues'],
    treatment_type: 'herbal',
    confidence: 0.75,
  },
  {
    keywords: ['joint', 'knee pain', 'arthritis', 'stiffness', 'back pain', 'muscle ache'],
    diseases: ['Joint Pain'],
    treatment_type: 'herbal',
    confidence: 0.72,
  },
  {
    keywords: ['insomnia', 'cannot sleep', 'sleep', 'tired', 'fatigue', 'sleepless'],
    diseases: ['Insomnia'],
    treatment_type: 'herbal',
    confidence: 0.71,
  },
]

export const DISCLAIMER =
  'This is an AI-assisted suggestion only, not a medical diagnosis. Please consult a qualified doctor.'
