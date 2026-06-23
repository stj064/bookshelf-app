import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wqdlimaodlztwmasouer.supabase.co'
const supabaseKey = 'sb_publishable_Zkp4_bVYbb08xydnat7k0A_UsjC3fU5'

export const supabase = createClient(supabaseUrl, supabaseKey)