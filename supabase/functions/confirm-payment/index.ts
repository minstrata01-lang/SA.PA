// @ts-ignore: EdgeRuntime is a global available in Supabase Edge runtime
declare const EdgeRuntime: { waitUntil: (p: Promise<unknown>) => void }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { generateInvoicePDF } from './invoice.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { consultation_id, action } = await req.json()

    if (!consultation_id || typeof consultation_id !== 'string' || !consultation_id.trim() || !['confirm', 'reject'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'consultation_id dan action (confirm|reject) wajib diisi' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const newPaymentStatus = action === 'confirm' ? 'confirmed' : 'rejected'
    const updatePayload: Record<string, string> = { payment_status: newPaymentStatus }
    if (action === 'confirm') updatePayload.session_status = 'active'

    const { data: updatedRows, error: updateError } = await supabase
      .from('consultations')
      .update(updatePayload)
      .eq('id', consultation_id)
      .select('id')

    if (updateError) {
      console.error('Update error:', updateError.message)
      return new Response(
        JSON.stringify({ error: 'Gagal update status pembayaran' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!updatedRows || updatedRows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Consultation tidak ditemukan' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Background task: kirim email + WA ────────────────────────────────
    const sendNotifications = async () => {
      const { data: consultation, error: selectError } = await supabase
        .from('consultations')
        .select('order_id, project_details, amount, clients(full_name, email, phone_number)')
        .eq('id', consultation_id)
        .single()

      if (selectError || !consultation) {
        console.error('Select error:', selectError?.message)
        return
      }

      const rawClient = consultation.clients
      const client = Array.isArray(rawClient) ? (rawClient[0] ?? null) : (rawClient ?? null)

      const clientName  = client?.full_name    || 'Pelanggan'
      const clientEmail = client?.email        || null
      const clientPhone = client?.phone_number || null

      // Kirim email via Resend
      if (clientEmail) {
        try {
          const subject = action === 'confirm'
            ? `Invoice & Konfirmasi Pembayaran — Order ${consultation.order_id}`
            : `Pembayaran Ditolak — Order ${consultation.order_id}`

          let attachments: Array<{ filename: string; content: string }> = []

          if (action === 'confirm') {
            try {
              const logoUrl = Deno.env.get('LOGO_URL')
              let logoFetched: string | undefined

              if (logoUrl) {
                try {
                  const controller = new AbortController()
                  const timeoutId  = setTimeout(() => controller.abort(), 8000)
                  const logoRes = await fetch(logoUrl, { signal: controller.signal })
                  clearTimeout(timeoutId)
                  if (logoRes.ok) logoFetched = logoUrl
                } catch {
                  console.warn('Logo fetch timeout/error, skip logo')
                }
              }

              const pdfBytes = await generateInvoicePDF({
                orderId: consultation.order_id,
                clientName,
                clientEmail,
                clientPhone: clientPhone || '-',
                projectDetails: consultation.project_details || '-',
                amount: consultation.amount || 500000,
                logoUrl: logoFetched,
              })
              let binary = ''
              pdfBytes.forEach((b) => (binary += String.fromCharCode(b)))
              attachments = [{
                filename: `invoice-${consultation.order_id}.pdf`,
                content: btoa(binary),
              }]
            } catch (pdfErr) {
              console.error('PDF gagal:', (pdfErr as Error).message)
            }
          }

          const invoiceNote = attachments.length > 0
            ? '<p>Invoice resmi terlampir pada email ini sebagai bukti pembayaran.</p>'
            : ''

          const html = action === 'confirm'
            ? `<h2>Pembayaran Dikonfirmasi</h2>
               <p>Halo <strong>${clientName}</strong>,</p>
               <p>Pembayaran Anda untuk order <strong>${consultation.order_id}</strong> telah dikonfirmasi.</p>
               ${invoiceNote}
               <p>Konsultan kami akan segera menghubungi Anda melalui WhatsApp.</p>
               <p>Terima kasih telah menggunakan layanan SAPA.</p>`
            : `<h2>Pembayaran Ditolak</h2>
               <p>Halo <strong>${clientName}</strong>,</p>
               <p>Maaf, pembayaran Anda untuk order <strong>${consultation.order_id}</strong> tidak dapat dikonfirmasi.</p>
               <p>Silakan upload ulang bukti transfer atau hubungi admin kami via WhatsApp.</p>`

          const emailPayload: Record<string, unknown> = {
            from: Deno.env.get('FROM_EMAIL'),
            to: clientEmail,
            subject,
            html,
          }
          if (attachments.length > 0) emailPayload.attachments = attachments

          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailPayload),
          })
          console.log('Email sent, status:', emailRes.status)
        } catch (emailErr) {
          console.error('Email gagal:', (emailErr as Error).message)
        }
      }

      // Kirim WA via Fonnte ke user
      if (clientPhone) {
        try {
          const formattedPhone = clientPhone.startsWith('0')
            ? '62' + clientPhone.slice(1)
            : clientPhone

          const pesanUser = action === 'confirm'
            ? `✅ *Pembayaran Dikonfirmasi*\n\nHalo ${clientName}, pembayaran Anda untuk order ${consultation.order_id} telah dikonfirmasi. Konsultan kami akan segera menghubungi Anda. Terima kasih!`
            : `❌ *Pembayaran Ditolak*\n\nHalo ${clientName}, maaf pembayaran Anda untuk order ${consultation.order_id} tidak dapat dikonfirmasi. Silakan upload ulang bukti transfer atau hubungi admin.`

          const waRes = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: { Authorization: Deno.env.get('FONNTE_TOKEN')! },
            body: new URLSearchParams({ target: formattedPhone, message: pesanUser }),
          })
          console.log('WA user sent, status:', waRes.status)
        } catch (waErr) {
          console.error('WA gagal:', (waErr as Error).message)
        }
      }
    }

    // Return response segera, kirim notifikasi di background
    EdgeRuntime.waitUntil(sendNotifications())

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
