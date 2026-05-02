'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Order, Pop, FormData } from '@/types'
import { generatePDF } from '@/lib/pdf-generator'
import { CheckCircle2, AlertCircle, Download, ChevronRight, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'

type Step = 'loading' | 'invalid' | 'expired' | 'used' | 'form' | 'done'

function DownloadContent() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''

  const [step, setStep] = useState<Step>('loading')
  const [order, setOrder] = useState<Order | null>(null)
  const [pops, setPops] = useState<Pop[]>([])
  const [currentPopIdx, setCurrentPopIdx] = useState(0)
  const [formData, setFormData] = useState<FormData>({})
  const [generating, setGenerating] = useState(false)
  const [downloadedPops, setDownloadedPops] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!token) { setStep('invalid'); return }
    fetch(`/api/download?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error === 'not_found') return setStep('invalid')
        if (data.error === 'expired') return setStep('expired')
        if (data.error === 'used') return setStep('used')
        setOrder(data.order)
        setPops(data.pops)
        setStep('form')
      })
      .catch(() => setStep('invalid'))
  }, [token])

  const currentPop = pops[currentPopIdx]

  const updateField = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  // Group fields by section
  const sections = currentPop
    ? currentPop.fields.reduce((acc: Record<string, typeof currentPop.fields>, field) => {
        acc[field.section] = acc[field.section] ?? []
        acc[field.section].push(field)
        return acc
      }, {})
    : {}

  const handleGenerate = async () => {
    if (!currentPop) return
    // Validate required fields
    const missing = currentPop.fields.filter(f => f.required && !formData[f.id]?.trim())
    if (missing.length > 0) {
      toast.error(`Preencha: ${missing.map(f => f.label).join(', ')}`)
      return
    }

    setGenerating(true)
    try {
      // Mark download as used on server
      await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, pop_id: currentPop.id }),
      })

      generatePDF(currentPop, formData)
      setDownloadedPops(prev => new Set([...prev, currentPop.id]))
      toast.success(`${currentPop.number} gerado com sucesso!`)
    } catch {
      toast.error('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setGenerating(false)
    }
  }

  // ── States ────────────────────────────────────────
  if (step === 'loading') return (
    <Screen icon="⏳" title="Verificando seu acesso..." subtitle="Aguarde um momento" />
  )
  if (step === 'invalid') return (
    <Screen icon="❌" title="Link inválido" subtitle="Este link não existe ou já foi removido." error />
  )
  if (step === 'expired') return (
    <Screen icon="⏰" title="Link expirado" subtitle="Este link de acesso expirou. Entre em contato com o suporte." error />
  )
  if (step === 'used') return (
    <Screen icon="🔒" title="Link já utilizado" subtitle="Este link de download já foi usado. Cada link permite apenas 1 acesso." error />
  )

  return (
    <div className="min-h-screen bg-cream-100">
      <header className="bg-green-800 text-white px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold">💊 Seus POPs</h1>
            <p className="text-green-100 text-xs mt-0.5">Preencha e gere os PDFs personalizados</p>
          </div>
          <div className="text-sm text-green-200">
            {downloadedPops.size}/{pops.length} gerados
          </div>
        </div>
      </header>

      {/* POP tabs */}
      {pops.length > 1 && (
        <div className="bg-white border-b border-green-100 px-6 overflow-x-auto">
          <div className="max-w-4xl mx-auto flex gap-1 py-3">
            {pops.map((pop, idx) => (
              <button
                key={pop.id}
                onClick={() => setCurrentPopIdx(idx)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  idx === currentPopIdx
                    ? 'bg-green-800 text-white'
                    : 'text-gray-600 hover:bg-green-50'
                }`}
              >
                {downloadedPops.has(pop.id) && <CheckCircle2 size={14} className="text-gold-400" />}
                {pop.number}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-8">
        {currentPop && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* POP info */}
            <div className="md:col-span-1">
              <div className="card p-5 sticky top-6">
                <span className="badge bg-green-100 text-green-800 mb-3 block w-fit">{currentPop.number}</span>
                <h2 className="font-display text-lg font-semibold text-green-800 mb-2">{currentPop.title}</h2>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">{currentPop.description}</p>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="btn-gold w-full flex items-center justify-center gap-2"
                >
                  {generating ? (
                    <><span className="animate-spin">⏳</span> Gerando...</>
                  ) : (
                    <><Download size={16} /> Gerar PDF</>
                  )}
                </button>
                {downloadedPops.has(currentPop.id) && (
                  <div className="mt-3 text-center text-xs text-green-700 flex items-center justify-center gap-1">
                    <CheckCircle2 size={14} /> PDF gerado!
                  </div>
                )}
                {pops.length > 1 && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setCurrentPopIdx(i => Math.max(0, i - 1))}
                      disabled={currentPopIdx === 0}
                      className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-1 disabled:opacity-30"
                    >
                      <ChevronLeft size={14} /> Anterior
                    </button>
                    <button
                      onClick={() => setCurrentPopIdx(i => Math.min(pops.length - 1, i + 1))}
                      disabled={currentPopIdx === pops.length - 1}
                      className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-1 disabled:opacity-30"
                    >
                      Próximo <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Form */}
            <div className="md:col-span-2">
              <div className="card p-6 space-y-6">
                <h3 className="font-semibold text-gray-700">Dados para o documento</h3>
                {Object.entries(sections).map(([sectionName, fields]) => (
                  <div key={sectionName}>
                    <p className="section-label">{sectionName}</p>
                    <div className="grid grid-cols-2 gap-3">
                      {fields.map(field => (
                        <div key={field.id} className={field.width === 'full' ? 'col-span-2' : 'col-span-1'}>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            {field.label} {field.required && <span className="text-red-400">*</span>}
                          </label>
                          {field.type === 'textarea' ? (
                            <textarea
                              className="input-field min-h-[70px]"
                              placeholder={field.placeholder}
                              value={formData[field.id] ?? ''}
                              onChange={e => updateField(field.id, e.target.value)}
                            />
                          ) : field.type === 'select' ? (
                            <select
                              className="input-field"
                              value={formData[field.id] ?? ''}
                              onChange={e => updateField(field.id, e.target.value)}
                            >
                              <option value="">Selecione...</option>
                              {field.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              className="input-field"
                              placeholder={field.placeholder}
                              value={formData[field.id] ?? ''}
                              onChange={e => updateField(field.id, e.target.value)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Screen({ icon, title, subtitle, error }: { icon: string; title: string; subtitle: string; error?: boolean }) {
  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center">
      <div className="card p-10 text-center max-w-sm">
        <div className="text-5xl mb-4">{icon}</div>
        <h2 className={`font-display text-xl font-bold mb-2 ${error ? 'text-red-700' : 'text-green-800'}`}>{title}</h2>
        <p className="text-gray-500 text-sm">{subtitle}</p>
      </div>
    </div>
  )
}

export default function DownloadPage() {
  return <Suspense><DownloadContent /></Suspense>
}
