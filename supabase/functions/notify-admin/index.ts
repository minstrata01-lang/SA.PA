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
    const { order_id } = await req.json()

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

    const { data: consultation } = await supabase
      .from('consultations')
      .select('order_id, amount, clients(full_name, email, phone_number)')
      .eq('order_id', order_id)
      .single()

    const client = consultation
      ? (Array.isArray(consultation.clients) ? consultation.clients[0] : consultation.clients)
      : null

    const clientName = client?.full_name || 'Pelanggan'
    const clientPhone = client?.phone_number || null

    // WA ke admin
    const pesanAdmin = `🔔 *Pesanan Baru Masuk*\n\nNo. Order: *${order_id}*\nNama: ${clientName}\nEmail: ${client?.email || '-'}\nNo. HP: ${clientPhone || '-'}\n\nBukti transfer telah diupload. Buka dashboard untuk verifikasi:\n${Deno.env.get('FRONTEND_URL')}/admin/consultations`

    const waAdminRes = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: Deno.env.get('FONNTE_TOKEN')! },
      body: new URLSearchParams({
        target: Deno.env.get('ADMIN_WA_NUMBER')!,
        message: pesanAdmin,
      }),
    })
    console.log('WA admin sent, status:', waAdminRes.status)

    // WA ke client
    if (clientPhone) {
      try {
        const formattedPhone =
          clientPhone.startsWith('0') ? '62' + clientPhone.slice(1) : clientPhone

        const pesanClient = `✅ *Bukti Transfer Diterima*\n\nHalo *${clientName}*,\n\nBukti transfer Anda untuk order *${order_id}* telah berhasil kami terima.\n\n📧 *Silakan cek email Anda* untuk mendapatkan informasi lebih lanjut mengenai order ini.\n\n⏳ Admin kami akan memverifikasi pembayaran Anda dan mengirimkan konfirmasi melalui email. Proses ini biasanya memakan waktu *maksimal 1x24 jam*.\n\nJika ada pertanyaan, jangan ragu untuk menghubungi kami.\n\nTerima kasih telah mempercayai layanan *SAPA*! 🙏`

        const waClientRes = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: { Authorization: Deno.env.get('FONNTE_TOKEN')! },
          body: new URLSearchParams({
            target: formattedPhone,
            message: pesanClient,
          }),
        })
        console.log('WA client sent, status:', waClientRes.status)
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
      JSON.stringify({ error: 'Internal server error', message: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
