import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'

export interface InvoiceParams {
  orderId:          string
  clientName:       string
  clientEmail:      string
  clientPhone:      string
  projectDetails:   string
  amount:           number
  logoUrl?:         string
  discountPercent?: number
  discountAmount?:  number
}

export async function generateInvoicePDF(params: InvoiceParams): Promise<Uint8Array> {
  const {
    orderId, clientName, clientEmail, clientPhone,
    projectDetails, amount, logoUrl,
    discountPercent, discountAmount,
  } = params

  const finalAmount          = discountAmount != null ? amount - discountAmount : amount
  const formattedAmount      = formatRupiah(amount)
  const formattedDiscount    = discountAmount != null ? formatRupiah(discountAmount) : null
  const formattedFinalAmount = formatRupiah(finalAmount)

  const pdfDoc = await PDFDocument.create()
  const page   = pdfDoc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()

  const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // ── Brand palette ──────────────────────────────────────────────────────
  const navy      = rgb(0,      0.239, 0.420)  // #003D6B
  const orange    = rgb(0.851,  0.467, 0.024)  // #D97706
  const white     = rgb(1,      1,     1)
  const black     = rgb(0,      0,     0)
  const grayDark  = rgb(0.35,   0.35,  0.35)
  const grayLight = rgb(0.945,  0.945, 0.945)
  const grayLine  = rgb(0.80,   0.80,  0.80)

  const today  = new Date()
  const dd     = today.getDate().toString().padStart(2, '0')
  const mm     = (today.getMonth() + 1).toString().padStart(2, '0')
  const yyyy   = today.getFullYear()
  const dateStr = `${dd}/${mm}/${yyyy}`
  const mL = 50          // left margin
  const mR = width - 50  // right edge

  // ═══════════════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════════════

  // -- Logo left, max 120 × 52 px --
  let logoBottomY = height - 46  // fallback if no logo
  if (logoUrl) {
    try {
      const logoRes = await fetch(logoUrl)
      if (logoRes.ok) {
        const logoBytes = new Uint8Array(await logoRes.arrayBuffer())
        const logoImage = await pdfDoc.embedPng(logoBytes)
        const logoDims  = logoImage.scaleToFit(120, 52)
        const logoY     = height - 24 - logoDims.height
        page.drawImage(logoImage, {
          x: mL, y: logoY,
          width: logoDims.width, height: logoDims.height,
        })
        logoBottomY = logoY
      }
    } catch (e) {
      console.warn('Logo gagal:', (e as Error).message)
      // fallback: draw "SAPA" text as logo substitute
      page.drawText('SAPA', {
        x: mL, y: height - 52,
        size: 28, font: fontBold, color: navy,
      })
      logoBottomY = height - 56
    }
  } else {
    // No logo URL: draw company name as wordmark
    page.drawText('SAPA', {
      x: mL, y: height - 52,
      size: 28, font: fontBold, color: navy,
    })
    logoBottomY = height - 56
  }

  // -- Company info (right column) --
  const coX    = mR - 200
  const coTopY = height - 26
  page.drawText('PT Stratalift Solusi Indonesia', {
    x: coX, y: coTopY,
    size: 9, font: fontBold, color: navy,
  })
  const coLines = [
    'Jl. Condet Raya No. 27, Jakarta Timur',
    'WA: 62881010512829',
    'contact@stratalift.co.id',
  ]
  coLines.forEach((line, i) => {
    page.drawText(line, {
      x: coX, y: coTopY - 13 - i * 12,
      size: 7.5, font: fontRegular, color: grayDark,
    })
  })

  // -- "INVOICE" label + order meta (below company info) --
  const invLabelY = coTopY - 13 - coLines.length * 12 - 10
  page.drawRectangle({
    x: coX - 4, y: invLabelY - 5,
    width: mR - coX + 4, height: 18,
    color: navy,
  })
  const invLabel = `INVOICE  ${sanitizeText(orderId)}`
  page.drawText(invLabel, {
    x: coX, y: invLabelY + 1,
    size: 8, font: fontBold, color: white,
  })

  // -- Orange separator --
  const sepHeaderY = Math.min(logoBottomY, invLabelY) - 14
  page.drawLine({
    start: { x: mL, y: sepHeaderY },
    end:   { x: mR, y: sepHeaderY },
    thickness: 2.5,
    color: orange,
  })

  // ═══════════════════════════════════════════════════════════════════════
  // KEPADA / TANGGAL two-column
  // ═══════════════════════════════════════════════════════════════════════
  const kepY   = sepHeaderY - 22
  const colMid = mL + 260

  // Left: client info
  page.drawText('KEPADA', {
    x: mL, y: kepY,
    size: 7, font: fontBold, color: orange,
  })
  page.drawText(sanitizeText(clientName), {
    x: mL, y: kepY - 16,
    size: 10.5, font: fontBold, color: navy,
  })
  page.drawText(sanitizeText(clientEmail), {
    x: mL, y: kepY - 30,
    size: 8.5, font: fontRegular, color: grayDark,
  })
  page.drawText(sanitizeText(clientPhone), {
    x: mL, y: kepY - 42,
    size: 8.5, font: fontRegular, color: grayDark,
  })

  // Right: date
  page.drawText('TANGGAL', {
    x: colMid, y: kepY,
    size: 7, font: fontBold, color: orange,
  })
  page.drawText(dateStr, {
    x: colMid, y: kepY - 16,
    size: 10.5, font: fontBold, color: navy,
  })

  // Thin rule below section
  const belowKepY = kepY - 62
  page.drawLine({
    start: { x: mL, y: belowKepY },
    end:   { x: mR, y: belowKepY },
    thickness: 0.5,
    color: grayLine,
  })

  // ═══════════════════════════════════════════════════════════════════════
  // TABLE
  // ═══════════════════════════════════════════════════════════════════════
  const tTop = belowKepY - 16
  const rH   = 24  // row height

  // Column X positions
  const c0 = mL        // KETERANGAN
  const c1 = mL + 255  // HARGA
  const c2 = c1 + 90   // JML
  const c3 = c2 + 40   // TOTAL

  // Header row
  page.drawRectangle({
    x: mL, y: tTop - rH + 5,
    width: mR - mL, height: rH,
    color: navy,
  })
  const tHeaders: [string, number][] = [
    ['KETERANGAN', c0 + 8],
    ['HARGA',      c1 + 8],
    ['JML',        c2 + 8],
    ['TOTAL',      c3 + 8],
  ]
  tHeaders.forEach(([label, x]) => {
    page.drawText(label, {
      x, y: tTop - 11,
      size: 8, font: fontBold, color: white,
    })
  })

  // Data row
  const r1Y = tTop - rH
  page.drawRectangle({
    x: mL, y: r1Y - rH + 5,
    width: mR - mL, height: rH,
    color: grayLight,
  })
  const tRow: [string, number][] = [
    ['Layanan Konsultasi Struktural', c0 + 8],
    [formattedAmount,                 c1 + 8],
    ['1',                             c2 + 8],
    [formattedAmount,                 c3 + 8],
  ]
  tRow.forEach(([text, x]) => {
    page.drawText(text, {
      x, y: r1Y - 11,
      size: 8.5, font: fontRegular, color: black,
    })
  })

  // Discount row (if applicable)
  if (formattedDiscount != null) {
    const r2Y = r1Y - rH
    page.drawRectangle({
      x: mL, y: r2Y - rH + 5,
      width: mR - mL, height: rH,
      color: grayLight,
    })
    const discRow: [string, number][] = [
      [`Diskon Voucher (${discountPercent}%)`, c0 + 8],
      [`-${formattedDiscount}`,                c1 + 8],
      ['1',                                    c2 + 8],
      [`-${formattedDiscount}`,                c3 + 8],
    ]
    discRow.forEach(([text, x]) => {
      page.drawText(text, {
        x, y: r2Y - 11,
        size: 8.5, font: fontRegular, color: rgb(0.6, 0.1, 0.1),
      })
    })
  }

  // Table bottom border
  const tBotY = r1Y - rH + 5
  page.drawLine({
    start: { x: mL, y: tBotY },
    end:   { x: mR, y: tBotY },
    thickness: 0.75,
    color: grayLine,
  })

  // ═══════════════════════════════════════════════════════════════════════
  // PEMBAYARAN (left) + TOTAL (right)
  // ═══════════════════════════════════════════════════════════════════════
  const payY     = tBotY - 28
  const totalBoxW = 190
  const totalBoxX = mR - totalBoxW

  // Left: bank info
  page.drawText('PEMBAYARAN', {
    x: mL, y: payY,
    size: 7.5, font: fontBold, color: orange,
  })
  const bankLines: [string, boolean][] = [
    ['Bank Syariah Indonesia (BSI)', true],
    ['No. Rekening: 7324808455',     false],
    ['A.N: PT Stratalift Solusi Indonesia', false],
  ]
  bankLines.forEach(([line, bold], i) => {
    page.drawText(line, {
      x: mL, y: payY - 15 - i * 13,
      size: 8.5,
      font: bold ? fontBold : fontRegular,
      color: bold ? navy : grayDark,
    })
  })

  // Right: total box
  const totalBoxH = 60
  page.drawRectangle({
    x: totalBoxX, y: payY - totalBoxH + 4,
    width: totalBoxW, height: totalBoxH,
    color: navy,
  })
  page.drawText('TOTAL PEMBAYARAN', {
    x: totalBoxX + 12, y: payY - 14,
    size: 7.5, font: fontBold, color: orange,
  })
  page.drawText(formattedFinalAmount, {
    x: totalBoxX + 12, y: payY - 38,
    size: 15, font: fontBold, color: white,
  })

  // ═══════════════════════════════════════════════════════════════════════
  // PROJECT NOTES
  // ═══════════════════════════════════════════════════════════════════════
  const notesY = payY - totalBoxH - 20
  page.drawText('Catatan Proyek:', {
    x: mL, y: notesY,
    size: 8, font: fontBold, color: navy,
  })
  page.drawText(sanitizeText(projectDetails || '-'), {
    x: mL, y: notesY - 14,
    size: 8, font: fontRegular, color: grayDark,
    maxWidth: width - 100,
    lineHeight: 13,
  })

  // ═══════════════════════════════════════════════════════════════════════
  // LUNAS badge
  // ═══════════════════════════════════════════════════════════════════════
  const lunasY = notesY - 52
  page.drawRectangle({
    x: mL, y: lunasY - 9,
    width: 80, height: 26,
    color: orange,
  })
  page.drawText('LUNAS', {
    x: mL + 12, y: lunasY + 2,
    size: 12, font: fontBold, color: white,
  })

  // ═══════════════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════════════
  page.drawLine({
    start: { x: mL, y: 75 },
    end:   { x: mR, y: 75 },
    thickness: 0.5,
    color: grayLine,
  })
  const tyText  = 'TERIMA KASIH ATAS KEPERCAYAAN ANDA'
  const tyW     = fontBold.widthOfTextAtSize(tyText, 9)
  page.drawText(tyText, {
    x: (width - tyW) / 2, y: 58,
    size: 9, font: fontBold, color: navy,
  })
  const copyText = '2026 SAPA - PT Stratalift Solusi Indonesia'
  const copyW    = fontRegular.widthOfTextAtSize(copyText, 7.5)
  page.drawText(copyText, {
    x: (width - copyW) / 2, y: 43,
    size: 7.5, font: fontRegular, color: grayDark,
  })

  return pdfDoc.save()
}

function formatRupiah(amount: number): string {
  const str = Math.floor(amount).toString()
  let result = ''
  for (let i = 0; i < str.length; i++) {
    if (i > 0 && (str.length - i) % 3 === 0) result += '.'
    result += str[i]
  }
  return `Rp ${result}`
}

function sanitizeText(text: string): string {
  return text.replace(/[^\x20-\x7E]/g, '?')
}
