import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    let body: { order_id?: unknown; code?: unknown }
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Request body tidak valid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const { order_id, code } = body as { order_id: string; code: string | null }

    if (!order_id || typeof order_id !== 'string' || order_id.length > 200) {
      return new Response(
        JSON.stringify({ error: 'order_id wajib diisi' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── REMOVE VOUCHER ───────────────────────────────────────────────────
    if (!code || !code.trim()) {
      // Cek apakah ada voucher sebelumnya
      const { data: current } = await supabase
        .from('consultations')
        .select('voucher_code')
        .eq('order_id', order_id)
        .single()

      if (current?.voucher_code) {
        // Decrement used_count dari voucher sebelumnya
        const { data: prevVoucher } = await supabase
          .from('vouchers')
          .select('id, used_count')
          .ilike('code', current.voucher_code)
          .single()

        if (prevVoucher && prevVoucher.used_count > 0) {
          const { error: decrementErr } = await supabase
            .from('vouchers')
            .update({ used_count: prevVoucher.used_count - 1 })
            .eq('id', prevVoucher.id)
          if (decrementErr) console.error('Gagal decrement used_count:', decrementErr.message)
        }
      }

      // Clear voucher di consultation
      const { error: clearErr } = await supabase
        .from('consultations')
        .update({ voucher_code: null, discount_percent: null, discount_amount: null })
        .eq('order_id', order_id)
      if (clearErr) {
        return new Response(
          JSON.stringify({ error: 'Gagal menghapus voucher dari konsultasi' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ removed: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── VALIDATE & APPLY VOUCHER ─────────────────────────────────────────
    const { data: voucher, error: vErr } = await supabase
      .from('vouchers')
      .select('id, code, discount_percent, max_uses, used_count, expires_at, is_active')
      .ilike('code', code.trim())
      .single()

    if (vErr || !voucher) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'Kode voucher tidak ditemukan' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!voucher.is_active) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'Voucher tidak aktif' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (voucher.used_count >= voucher.max_uses) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'Kuota voucher sudah habis' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'Voucher sudah kadaluarsa' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Ambil amount konsultasi + cek apakah sudah ada voucher sebelumnya
    const { data: consultation } = await supabase
      .from('consultations')
      .select('amount, voucher_code')
      .eq('order_id', order_id)
      .single()

    if (!consultation) {
      return new Response(
        JSON.stringify({ error: 'Konsultasi tidak ditemukan' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const isSameVoucher = consultation.voucher_code?.toLowerCase() === voucher.code.toLowerCase()

    // Jika voucher sebelumnya berbeda, decrement yang lama
    if (consultation.voucher_code && !isSameVoucher) {
      const { data: prevV } = await supabase
        .from('vouchers')
        .select('id, used_count')
        .ilike('code', consultation.voucher_code)
        .single()

      if (prevV && prevV.used_count > 0) {
        const { error: swapDecrErr } = await supabase
          .from('vouchers')
          .update({ used_count: prevV.used_count - 1 })
          .eq('id', prevV.id)
        if (swapDecrErr) console.error('Gagal decrement voucher lama:', swapDecrErr.message)
      }
    }

    // Increment used_count hanya jika bukan voucher yang sama
    if (!isSameVoucher) {
      const { error: incrementErr } = await supabase
        .from('vouchers')
        .update({ used_count: voucher.used_count + 1 })
        .eq('id', voucher.id)
      if (incrementErr) {
        return new Response(
          JSON.stringify({ error: 'Gagal memperbarui kuota voucher' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const amount = consultation.amount
    if (amount == null) {
      return new Response(
        JSON.stringify({ error: 'Data konsultasi tidak memiliki nilai amount' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const discountAmount = Math.round(amount * voucher.discount_percent / 100)
    const finalAmount    = amount - discountAmount

    // Simpan ke consultation
    const { error: consultationErr } = await supabase
      .from('consultations')
      .update({
        voucher_code:     voucher.code,
        discount_percent: voucher.discount_percent,
        discount_amount:  discountAmount,
      })
      .eq('order_id', order_id)
    if (consultationErr) {
      console.error('CRITICAL: used_count incremented but consultation update failed', {
        order_id, voucherId: voucher.id,
      })
      return new Response(
        JSON.stringify({ error: 'Gagal menyimpan voucher ke konsultasi' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        valid:            true,
        code:             voucher.code,
        discount_percent: voucher.discount_percent,
        discount_amount:  discountAmount,
        final_amount:     finalAmount,
      }),
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
