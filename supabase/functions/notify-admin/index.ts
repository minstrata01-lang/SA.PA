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
    const body = await req.json()
    const { order_id, voucher_used } = body as { order_id: string; voucher_used?: boolean }

    if (!order_id || typeof order_id !== 'string' || !order_id.trim()) {
      return new Response(
        JSON.stringify({ error: 'order_id wajib diisi' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Jika 100% voucher, update payment_status ke pending_verification
    if (voucher_used) {
      const { error: updateStatusErr } = await supabase
        .from('consultations')
        .update({ payment_status: 'pending_verification' })
        .eq('order_id', order_id)
      if (updateStatusErr) console.error('payment_status update failed:', updateStatusErr.message)
    }

    const { data: consultation } = await supabase
      .from('consultations')
      .select('order_id, amount, voucher_code, discount_percent, discount_amount, clients(full_name, email, phone_number)')
      .eq('order_id', order_id)
      .single()

    const rawClient = consultation?.clients ?? null
    const client = Array.isArray(rawClient) ? (rawClient[0] ?? null) : rawClient

    const clientName  = client?.full_name    || 'Pelanggan'
    const clientPhone = client?.phone_number  || null

    // Susun pesan WA admin
    let voucherLine = ''
    if (voucher_used && consultation?.voucher_code) {
      const disc     = consultation.discount_percent ?? 0
      const discAmt  = consultation.discount_amount ?? 0
      const finalAmt = (consultation.amount ?? 500000) - discAmt
      voucherLine = `\n\n🎟️ *Voucher digunakan*\nKode: ${consultation.voucher_code} — Diskon ${disc}% (Rp ${discAmt.toLocaleString('id-ID')})\nTotal dibayar: Rp ${finalAmt.toLocaleString('id-ID')}`
    }

    const pesanAdmin = `🔔 *${voucher_used ? 'Pesanan Voucher 100%' : 'Pesanan Baru Masuk'}*\n\nNo. Order: *${order_id}*\nNama: ${clientName}\nEmail: ${client?.email || '-'}\nNo. HP: ${clientPhone || '-'}${voucherLine}\n\n${voucher_used ? 'Pesanan ini menggunakan voucher 100%.' : 'Bukti transfer telah diupload.'} Buka dashboard untuk verifikasi:\n${Deno.env.get('FRONTEND_URL')}/admin/consultations`

    const waAdminRes = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: Deno.env.get('FONNTE_TOKEN')! },
      body: new URLSearchParams({
        target:  Deno.env.get('ADMIN_WA_NUMBER')!,
        message: pesanAdmin,
      }),
    })
    console.log('WA admin sent, status:', waAdminRes.status)

    // WA ke client
    if (clientPhone) {
      try {
        const formattedPhone = clientPhone.startsWith('0')
          ? '62' + clientPhone.slice(1)
          : clientPhone

        const pesanClient = `✅ *${voucher_used ? 'Voucher Berhasil Digunakan' : 'Bukti Transfer Diterima'}*\n\nHalo *${clientName}*,\n\n${
          voucher_used
            ? `Voucher Anda untuk order *${order_id}* telah berhasil diproses.\n\n⏳ Admin kami akan mengaktifkan sesi konsultasi Anda segera.`
            : `Bukti transfer Anda untuk order *${order_id}* telah berhasil kami terima.\n\n📧 *Silakan cek email Anda* untuk informasi lebih lanjut.\n\n⏳ Admin kami akan memverifikasi pembayaran dalam *maksimal 1x24 jam*.`
        }\n\nTerima kasih telah mempercayai layanan *SAPA*! 🙏`

        await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: { Authorization: Deno.env.get('FONNTE_TOKEN')! },
          body: new URLSearchParams({ target: formattedPhone, message: pesanClient }),
        })
      } catch (waErr) {
        console.error('WA client gagal:', (waErr as Error).message)
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Unhandled error:', (err as Error).message)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
