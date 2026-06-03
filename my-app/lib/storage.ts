import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'

const BUCKET = 'GameBot'

let client: SupabaseClient | null = null

function getSupabaseClient() {
  if (client) {
    return client
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured',
    )
  }

  client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return client
}

export async function uploadGameHtml({
  chatId,
  html,
}: {
  chatId: string
  html: string
}): Promise<{ url: string; path: string }> {
  const supabase = getSupabaseClient()
  const path = `${chatId}/${nanoid()}.html`

  const { error } = await supabase.storage.from(BUCKET).upload(path, html, {
    contentType: 'text/html',
    upsert: false,
  })

  if (error) {
    throw new Error(`Failed to upload game HTML to storage: ${error.message}`)
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return { url: publicUrl, path }
}
