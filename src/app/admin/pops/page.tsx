'use client'
import { useEffect, useState } from 'react'
import type { Pop, PopField } from '@/types'
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Save, GripVertical } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = ['Administrativo', 'Atendimento', 'Armazenamento', 'Controle', 'Higiene', 'Farmacotécnica']
const FIELD_TYPES = ['text', 'date', 'select', 'textarea'] as const

const emptyPop = (): Partial<Pop> => ({
  title: '', number: '', description: '', price: 0,
  category: 'Administrativo', fields: [], template: '{}', active: true,
})

const emptyField = (): PopField => ({
  id: crypto.randomUUID().slice(0, 8),
  label: '', placeholder: '', type: 'text',
  required: false, section: 'Informações', width: 'half',
})

export default function AdminPopsPage() {
  const [pops, setPops] = useState<Pop[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<Pop> | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'fields' | 'template'>('info')
  const [editingField, setEditingField] = useState<PopField | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/pops')
      .then(r => r.json())
      .then(data => { setPops(Array.isArray(data) ? data : []); setLoading(false) })
  }

  useEffect(load, [])

  const openNew = () => { setEditing(emptyPop()); setIsNew(true); setActiveTab('info') }
  const openEdit = (pop: Pop) => { setEditing({ ...pop }); setIsNew(false); setActiveTab('info') }
  const close = () => { setEditing(null); setEditingField(null) }

  const set = (key: keyof Pop, val: any) => setEditing(prev => ({ ...prev!, [key]: val }))

  const save = async () => {
    if (!editing?.title || !editing?.number) return toast.error('Título e número são obrigatórios')
    setSaving(true)
    try {
      const method = isNew ? 'POST' : 'PATCH'
      const body = isNew ? editing : { id: editing.id, ...editing }
      const res = await fetch('/api/admin/pops', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      toast.success(isNew ? 'POP criado!' : 'POP atualizado!')
      close(); load()
    } catch {
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const deletePop = async (id: string, title: string) => {
    if (!confirm(`Deletar "${title}"?`)) return
    const res = await fetch(`/api/admin/pops?id=${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('POP deletado'); load() }
    else toast.error('Erro ao deletar')
  }

  const toggleActive = async (pop: Pop) => {
    await fetch('/api/admin/pops', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: pop.id, active: !pop.active }),
    })
    load()
  }

  // ── Field management ──────────────────────────────
  const fields: PopField[] = (editing?.fields as PopField[]) ?? []

  const addField = () => {
    const f = emptyField()
    set('fields', [...fields, f])
    setEditingField(f)
  }

  const updateField = (idx: number, updates: Partial<PopField>) => {
    const next = fields.map((f, i) => i === idx ? { ...f, ...updates } : f)
    set('fields', next)
    if (editingField && fields[idx]?.id === editingField.id) {
      setEditingField({ ...editingField, ...updates })
    }
  }

  const removeField = (idx: number) => {
    set('fields', fields.filter((_, i) => i !== idx))
    setEditingField(null)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-green-800">Gerenciar POPs</h1>
          <p className="text-gray-500 text-sm mt-1">{pops.length} procedimentos cadastrados</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo POP
        </button>
      </div>

      {/* POPs Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-green-50 border-b border-green-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider">Nº</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider">Título</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider hidden md:table-cell">Categoria</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider hidden sm:table-cell">Preço</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider">Status</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-green-800 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-green-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : pops.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Nenhum POP cadastrado</td></tr>
            ) : pops.map(pop => (
              <tr key={pop.id} className="hover:bg-green-50/50 transition-colors">
                <td className="px-6 py-3">
                  <span className="badge bg-green-100 text-green-800 font-mono">{pop.number}</span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{pop.title}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{pop.category}</td>
                <td className="px-4 py-3 text-green-800 font-semibold hidden sm:table-cell">
                  R$ {(pop.price / 100).toFixed(2).replace('.', ',')}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${pop.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {pop.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => toggleActive(pop)} title={pop.active ? 'Desativar' : 'Ativar'}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                      {pop.active ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={() => openEdit(pop)} title="Editar"
                      className="p-2 rounded-lg hover:bg-green-100 text-gray-400 hover:text-green-700 transition-colors">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => deletePop(pop.id, pop.title)} title="Deletar"
                      className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── EDIT MODAL ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl my-8 shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-green-100">
              <h2 className="font-display text-xl font-bold text-green-800">
                {isNew ? 'Novo POP' : `Editar ${editing.number}`}
              </h2>
              <button onClick={close} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-green-100">
              {(['info', 'fields', 'template'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                    activeTab === tab
                      ? 'border-green-700 text-green-800'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'info' ? 'Informações' : tab === 'fields' ? 'Campos do Formulário' : 'Template do Documento'}
                </button>
              ))}
            </div>

            <div className="p-8">
              {/* ── TAB: Info ── */}
              {activeTab === 'info' && (
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Número *</label>
                    <input className="input-field" placeholder="POP 01" value={editing.number ?? ''} onChange={e => set('number', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Preço (R$) *</label>
                    <input className="input-field" type="number" step="0.01" placeholder="29.90"
                      value={editing.price ? editing.price / 100 : ''}
                      onChange={e => set('price', Math.round(parseFloat(e.target.value || '0') * 100))} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Título *</label>
                    <input className="input-field" placeholder="Documentação" value={editing.title ?? ''} onChange={e => set('title', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Categoria</label>
                    <select className="input-field" value={editing.category ?? ''} onChange={e => set('category', e.target.value)}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-gray-500">Ativo</label>
                    <button onClick={() => set('active', !editing.active)}
                      className={`w-12 h-6 rounded-full transition-all ${editing.active ? 'bg-green-600' : 'bg-gray-300'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${editing.active ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Descrição</label>
                    <textarea className="input-field min-h-[80px]" placeholder="Objetivo deste POP..."
                      value={editing.description ?? ''} onChange={e => set('description', e.target.value)} />
                  </div>
                </div>
              )}

              {/* ── TAB: Fields ── */}
              {activeTab === 'fields' && (
                <div className="grid grid-cols-5 gap-6">
                  {/* Field list */}
                  <div className="col-span-2 space-y-2">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Campos ({fields.length})</span>
                      <button onClick={addField} className="flex items-center gap-1 text-xs text-green-700 font-medium hover:underline">
                        <Plus size={13} /> Adicionar
                      </button>
                    </div>
                    {fields.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                        Nenhum campo ainda.<br />Clique em Adicionar.
                      </div>
                    ) : (
                      fields.map((field, idx) => (
                        <div
                          key={field.id}
                          onClick={() => setEditingField(field)}
                          className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer border transition-all ${
                            editingField?.id === field.id
                              ? 'border-green-700 bg-green-50'
                              : 'border-green-50 bg-gray-50 hover:border-green-200'
                          }`}
                        >
                          <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">{field.label || '(sem nome)'}</p>
                            <p className="text-xs text-gray-400">{field.type} · {field.section}</p>
                          </div>
                          <button onClick={e => { e.stopPropagation(); removeField(idx) }}
                            className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 flex-shrink-0">
                            <X size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Field editor */}
                  <div className="col-span-3">
                    {editingField ? (
                      <div className="border border-green-100 rounded-xl p-5 space-y-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Editar Campo</p>
                        {[
                          { key: 'label', label: 'Label *', type: 'text', placeholder: 'Ex: Razão Social' },
                          { key: 'placeholder', label: 'Placeholder', type: 'text', placeholder: 'Texto de exemplo' },
                          { key: 'section', label: 'Seção', type: 'text', placeholder: 'Ex: Estabelecimento' },
                        ].map(({ key, label, type, placeholder }) => (
                          <div key={key}>
                            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                            <input className="input-field" type={type} placeholder={placeholder}
                              value={(editingField as any)[key] ?? ''}
                              onChange={e => {
                                const idx = fields.findIndex(f => f.id === editingField.id)
                                if (idx >= 0) updateField(idx, { [key]: e.target.value } as any)
                              }} />
                          </div>
                        ))}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                            <select className="input-field"
                              value={editingField.type}
                              onChange={e => {
                                const idx = fields.findIndex(f => f.id === editingField.id)
                                if (idx >= 0) updateField(idx, { type: e.target.value as any })
                              }}>
                              {FIELD_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Largura</label>
                            <select className="input-field"
                              value={editingField.width ?? 'half'}
                              onChange={e => {
                                const idx = fields.findIndex(f => f.id === editingField.id)
                                if (idx >= 0) updateField(idx, { width: e.target.value as any })
                              }}>
                              <option value="half">Metade</option>
                              <option value="full">Completo</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="required" checked={editingField.required}
                            onChange={e => {
                              const idx = fields.findIndex(f => f.id === editingField.id)
                              if (idx >= 0) updateField(idx, { required: e.target.checked })
                            }} className="accent-green-700" />
                          <label htmlFor="required" className="text-sm text-gray-600">Campo obrigatório</label>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-200 rounded-xl h-full flex items-center justify-center text-gray-400 text-sm min-h-[200px]">
                        Selecione um campo para editar
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── TAB: Template ── */}
              {activeTab === 'template' && (
                <div>
                  <p className="text-sm text-gray-500 mb-3">
                    JSON do template do documento. Use <code className="bg-gray-100 px-1 rounded text-xs">{`{{fieldId}}`}</code> para inserir dados do formulário.
                    <a href="/docs/template-guide" className="text-green-700 hover:underline ml-2 text-xs">Ver guia →</a>
                  </p>
                  <textarea
                    className="input-field font-mono text-xs min-h-[380px]"
                    value={typeof editing.template === 'string' ? editing.template : JSON.stringify(editing.template, null, 2)}
                    onChange={e => set('template', e.target.value)}
                    spellCheck={false}
                  />
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-green-100">
              <button onClick={close} className="btn-secondary">Cancelar</button>
              <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2">
                <Save size={16} /> {saving ? 'Salvando...' : 'Salvar POP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
