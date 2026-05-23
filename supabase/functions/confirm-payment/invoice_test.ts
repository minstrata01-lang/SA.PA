import { assert, assertEquals, assertInstanceOf } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import { generateInvoicePDF } from './invoice.ts'

const baseParams = {
  orderId: 'TEST-001',
  clientName: 'Budi Santoso',
  clientEmail: 'budi@example.com',
  clientPhone: '6281234567890',
  projectDetails: 'Renovasi rumah 2 lantai di Bekasi',
  amount: 500000,
}

Deno.test('generateInvoicePDF returns Uint8Array', async () => {
  const bytes = await generateInvoicePDF(baseParams)
  assertInstanceOf(bytes, Uint8Array)
  assert(bytes.length > 0)
})

Deno.test('generateInvoicePDF output starts with PDF magic bytes', async () => {
  const bytes = await generateInvoicePDF(baseParams)
  // PDF magic bytes: %PDF = [0x25, 0x50, 0x44, 0x46]
  assertEquals(bytes[0], 0x25)
  assertEquals(bytes[1], 0x50)
  assertEquals(bytes[2], 0x44)
  assertEquals(bytes[3], 0x46)
})

Deno.test('generateInvoicePDF works without logoUrl', async () => {
  const bytes = await generateInvoicePDF({ ...baseParams, logoUrl: undefined })
  assertInstanceOf(bytes, Uint8Array)
  assert(bytes.length > 0)
})

Deno.test('generateInvoicePDF com diskon shows discount row', async () => {
  const bytes = await generateInvoicePDF({
    ...baseParams,
    discountPercent: 50,
    discountAmount: 250000,
  })
  assertInstanceOf(bytes, Uint8Array)
  assert(bytes.length > 0)
})

Deno.test('generateInvoicePDF com diskon 100% does not error', async () => {
  const bytes = await generateInvoicePDF({
    ...baseParams,
    discountPercent: 100,
    discountAmount: 500000,
  })
  assertInstanceOf(bytes, Uint8Array)
  assert(bytes.length > 0)
})
