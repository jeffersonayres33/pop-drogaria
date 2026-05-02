'use client'
import jsPDF from 'jspdf'
import type { Pop, FormData } from '@/types'

// Resolves template placeholders like {{razaoSocial}} with form data
function resolve(text: string, data: FormData): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? `[${key}]`)
}

function fmtDate(val: string): string {
  if (!val) return '___/___/______'
  const [y, m, d] = val.split('-')
  return `${d}/${m}/${y}`
}

export function generatePDF(pop: Pop, formData: FormData): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  // Resolve date fields
  const data: FormData = {}
  pop.fields.forEach(f => {
    const raw = formData[f.id] ?? ''
    data[f.id] = f.type === 'date' ? fmtDate(raw) : raw
  })

  const L = 14, R = 196, W = R - L
  let y = 15

  // ── HEADER TABLE ──────────────────────────────────────────────
  const hdrH = 32
  doc.setDrawColor(100); doc.setLineWidth(0.5)
  doc.rect(L, y, W, hdrH)

  const c1 = L + 55, c2 = c1 + 88
  doc.line(c1, y, c1, y + hdrH)
  doc.line(c2, y, c2, y + hdrH)

  // col1 – company name
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
  const razao = resolve('{{razaoSocial}}', data) || data.razaoSocial || 'DROGARIA'
  const cnpj  = data.cnpj || '___.___.___/____-__'
  doc.text(razao, L + 2, y + 6, { maxWidth: 50 })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5)
  doc.text('CNPJ: ' + cnpj, L + 2, y + 14)

  // col2 – POP title
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
  doc.text(
    `${pop.number}  |  ${pop.title.toUpperCase()}`,
    c1 + (c2 - c1) / 2,
    y + hdrH / 2 + 1,
    { align: 'center', maxWidth: 85 }
  )

  // col3 – metadata
  const meta: [string, string][] = [
    ['DATA DE ELABORAÇÃO:', data.dataElaboracao || ''],
    ['VERSÃO:', data.versao || '01'],
    ['REVISÃO:', data.revisao || '00'],
    ['DATA DA REVISÃO:', data.dataRevisao || ''],
    ['RESPONSÁVEL TÉCNICO:', data.farmaceutico || ''],
    ['CRF:', data.crf || ''],
  ]
  doc.setFontSize(6.5)
  meta.forEach(([k, v], i) => {
    doc.setFont('helvetica', 'bold')
    doc.text(k, c2 + 2, y + 5 + i * 4.5)
    doc.setFont('helvetica', 'normal')
    doc.text(v, c2 + 2 + doc.getTextWidth(k) + 1, y + 5 + i * 4.5)
  })
  y += hdrH + 8

  // ── MAIN TITLE ───────────────────────────────────────────────
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
  const mainTitle = resolve(pop.template ? JSON.parse(pop.template).mainTitle || pop.title : pop.title, data)
  doc.text(mainTitle.toUpperCase(), 105, y, { align: 'center' })
  y += 10

  // ── SECTIONS from template ────────────────────────────────────
  const template = pop.template ? JSON.parse(pop.template) : null
  const sections = template?.sections ?? defaultSections(pop, data)

  for (const section of sections) {
    // Section heading
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8)
    doc.text(`${section.number}. ${section.title.toUpperCase()}`, L, y)
    y += 5

    // Section body
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5)

    for (const block of section.blocks) {
      const text = resolve(block.text, data)

      if (block.type === 'paragraph') {
        const lines = doc.splitTextToSize(text, W)
        doc.text(lines, L, y)
        y += lines.length * 4 + 3
      }

      if (block.type === 'list') {
        const items: string[] = block.items.map((t: string) => resolve(t, data))
        items.forEach((item, idx) => {
          const lines = doc.splitTextToSize(`${idx + 1}. ${item}`, W - 8)
          doc.text(lines, L + 6, y)
          y += lines.length * 4 + 1
        })
        y += 2
      }

      if (block.type === 'table') {
        const rows: [string, string][] = block.rows.map(([k, v]: [string, string]) => [k, resolve(v, data)])
        rows.forEach(([k, v]) => {
          doc.setDrawColor(150); doc.setLineWidth(0.3)
          doc.rect(L, y - 3.5, W, 6.5)
          doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
          doc.text(k, L + 2, y + 0.5)
          doc.setFont('helvetica', 'normal')
          const vLines = doc.splitTextToSize(v, W - 55)
          doc.text(vLines[0], L + 52, y + 0.5)
          y += 7
        })
        y += 3
      }
    }
  }

  // ── FOOTER ───────────────────────────────────────────────────
  doc.setDrawColor(160); doc.setLineWidth(0.4)
  doc.line(L, y, R, y); y += 5

  const farm = data.farmaceutico || '___________________________'
  const crf  = data.crf || '______'
  const dataElab = data.dataElaboracao || '___/___/______'
  const endereco = data.endereco || ''
  const tel = data.telefone || ''

  doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
  doc.text('Elaboração e Aprovação', L, y); y += 5
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7)
  doc.text(`Visto _________________________________    Data: ${dataElab}`, L, y); y += 5
  doc.text(`${farm} – CRF ${crf}`, L, y); y += 4
  doc.setFont('helvetica', 'italic')
  doc.text('Responsável Técnico', L, y)

  // bottom right
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7)
  doc.text('Página 1 de 1', R, y - 8, { align: 'right' })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5)
  doc.text(razao, R, y - 3, { align: 'right' })
  doc.text(`CNPJ: ${cnpj}`, R, y + 1, { align: 'right' })
  if (endereco) {
    const el = doc.splitTextToSize(endereco, 90)
    el.forEach((l: string, i: number) => doc.text(l, R, y + 5 + i * 4, { align: 'right' }))
  }
  if (tel) doc.text(`Tel.: ${tel}`, R, y + 10, { align: 'right' })

  const safeName = razao.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)
  doc.save(`${pop.number.replace(' ', '_')}_${safeName}.pdf`)
}

// Fallback sections if no template is defined
function defaultSections(pop: Pop, data: FormData) {
  return [
    {
      number: '1',
      title: 'Objetivos',
      blocks: [{ type: 'paragraph', text: pop.description }]
    },
    {
      number: '2',
      title: 'Áreas Envolvidas / Responsabilidade',
      blocks: [{ type: 'paragraph', text: 'Administração  |  Farmacêutico Responsável' }]
    },
    {
      number: '3',
      title: 'Referências',
      blocks: [{ type: 'paragraph', text: 'RDC Nº 44, DE 17 DE AGOSTO DE 2009' }]
    },
  ]
}
