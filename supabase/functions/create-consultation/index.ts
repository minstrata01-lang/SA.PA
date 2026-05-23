declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void
  env: {
    get: (key: string) => string | undefined
  }
}
// @ts-ignore URL imports are resolved by the Supabase Edge (Deno) runtime.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fullName, email, phone, selectedCategories, location } = await req.json()

    if (!fullName || !email || !phone) {
      return new Response(
        JSON.stringify({ error: 'fullName, email, dan phone wajib diisi' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use service role key to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Upsert client by email (UNIQUE constraint di-enforce di DB)
    // ignoreDuplicates: false → jika email sama, update full_name & phone_number
    const { data: clientRow, error: upsertClientError } = await supabase
      .from('clients')
      .upsert(
        { full_name: fullName, email, phone_number: phone },
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select('id')
      .single()

    if (upsertClientError) throw upsertClientError
    const clientId = clientRow.id

    // 2. Check if there's already a pending consultation for this client
    const { data: existingConsult } = await supabase
      .from('consultations')
      .select('order_id')
      .eq('client_id', clientId)
      .eq('payment_status', 'pending')
      .maybeSingle()

    if (existingConsult?.order_id) {
      return new Response(
        JSON.stringify({ order_id: existingConsult.order_id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Generate order_id dengan retry loop untuk hindari race condition
    const now = new Date()
    const dd   = String(now.getDate()).padStart(2, '0')
    const mm   = String(now.getMonth() + 1).padStart(2, '0')
    const yyyy = now.getFullYear()
    const todayPrefix = `SAPA/${dd}/${mm}/${yyyy}/`

    let orderId = ''
    let inserted = false
    const MAX_RETRIES = 5

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // Query MAX antrian dari order_id hari ini (bukan COUNT) agar selalu akurat
      const { data: todayRows } = await supabase
        .from('consultations')
        .select('order_id')
        .like('order_id', `${todayPrefix}%`)

      const maxAntrian = (todayRows ?? []).reduce((max, row) => {
        const parts = (row.order_id as string)?.split('/')
        const num = parseInt(parts?.[4] ?? '0', 10)
        return Math.max(max, isNaN(num) ? 0 : num)
      }, 0)

      orderId = `${todayPrefix}${String(maxAntrian + 1).padStart(3, '0')}`

      // 4. Insert consultation — jika duplicate key, retry dengan antrian baru
      const { error: consultError } = await supabase
        .from('consultations')
        .insert([{
          order_id: orderId,
          client_id: clientId,
          payment_status: 'pending',
          session_status: 'inactive',
          selected_categories: selectedCategories ?? [],
          location: location ?? null,
        }])

      if (!consultError) {
        inserted = true
        break
      }

      // 23505 = unique_violation — coba lagi dengan antrian +1
      if ((consultError as any).code !== '23505') throw consultError
    }

    if (!inserted) throw new Error('Gagal generate order ID unik setelah beberapa percobaan.')

    return new Response(
      JSON.stringify({ order_id: orderId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Unhandled error:', (err as Error).message)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
