import { createClient } from '@supabase/supabase-js'

let supabase = null

const supabaseUrl = process.env.SUPABASE_URL
// Use service role key for backend — bypasses RLS so server-side writes work.
// Falls back to anon key if service key is not set (read-only / public queries only).
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        db: { schema: 'public' },
    })
} else {
    console.warn('Missing Supabase env vars: SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_KEY)')
}

export function requireSupabase() {
    if (!supabase) {
        throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_KEY.')
    }
    return supabase
}

// Retry wrapper for Supabase queries
// Usage: const result = await withRetry(db => db.from('table').select('*'))
const withRetry = async (queryFn, retries = 3, delay = 500) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const db = requireSupabase()
            const result = await queryFn(db)
            if (result.error) throw result.error
            return result
        } catch (err) {
            if (attempt === retries) throw err
            await new Promise(res => setTimeout(res, delay * attempt))
        }
    }
}

export { withRetry }
export default supabase
