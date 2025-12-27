import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://dwpsptddeoovihwgkdcu.supabase.co"
const supabaseKey = "sb_publishable_QjKocQ7NeYMJAiLlduYpwQ_yYjSlXrN"

export const supabase = createClient(supabaseUrl, supabaseKey)