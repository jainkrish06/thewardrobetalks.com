'use client'

import { useEffect, useState, useContext } from 'react'
import { AuthContext } from '../layout'
import { toast } from 'sonner'
import {
  Sliders,
  Plus,
  Trash2,
  Upload,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  X
} from 'lucide-react'

export default function HeroSlidesPage() {
  const { apiCall, user } = useContext(AuthContext)
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)

  // Editor states
  const [isAdding, setIsAdding] = useState(false)
  const [form, setForm] = useState({ kicker: '', title: '', subtitle: '', image: '', ctaLabel: '', ctaTarget: '' })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'CONTENT_MANAGER'

  useEffect(() => {
    loadSlides()
  }, [])

  async function loadSlides() {
    setLoading(true)
    try {
      const res = await apiCall('/admin/hero')
      if (res.success) {
        setSlides(res.data || [])
      } else {
        toast.error(res.error?.message || 'Failed to load slides.')
      }
    } catch (err) {
      toast.error('Failed to load slides.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const token = localStorage.getItem('wt_admin_token')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? 'https://wardrobe-talks-couture.netlify.app' : 'http://localhost:3000')
      const res = await fetch(`${apiUrl}/api/admin/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (data.success && data.data?.url) {
        setForm(prev => ({ ...prev, image: data.data.url }))
        toast.success('Hero background uploaded to CDN.')
      } else {
        toast.error(data.error?.message || 'Failed to upload image.')
      }
    } catch (err) {
      toast.error('Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.image) return toast.error('Hero background image is required.')
    setSaving(true)
    try {
      const res = await apiCall('/admin/hero', {
        method: 'POST',
        body: JSON.stringify(form)
      })
      if (res.success) {
        toast.success('Hero slide created successfully.')
        setIsAdding(false)
        setForm({ kicker: '', title: '', subtitle: '', image: '', ctaLabel: '', ctaTarget: '' })
        loadSlides()
      } else {
        toast.error(res.error?.message || 'Failed to create slide.')
      }
    } catch (err) {
      toast.error('Failed to save slide.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!canEdit) return toast.error('Access Denied. Insufficient permissions.')
    if (!confirm('Are you sure you want to delete this hero slide?')) return
    try {
      const res = await apiCall(`/admin/hero/${id}`, { method: 'DELETE' })
      if (res.success) {
        toast.success('Hero slide deleted.')
        loadSlides()
      } else {
        toast.error(res.error?.message || 'Failed to delete slide.')
      }
    } catch (err) {
      toast.error('Delete request failed.')
    }
  }

  const handleToggleActive = async (s) => {
    if (!canEdit) return toast.error('Access Denied. Insufficient permissions.')
    try {
      const res = await apiCall(`/admin/hero/${s.id}`, {
        method: 'PUT',
        body: JSON.stringify({ active: !s.active })
      })
      if (res.success) {
        toast.success(s.active ? 'Slide deactivated.' : 'Slide activated.')
        loadSlides()
      } else {
        toast.error(res.error?.message || 'Failed to update slide status.')
      }
    } catch (err) {
      toast.error('Failed to update status.')
    }
  }

  const moveSlideOrder = async (index, direction) => {
    if (!canEdit) return toast.error('Access Denied. Insufficient permissions.')
    const targetIdx = index + direction
    if (targetIdx < 0 || targetIdx >= slides.length) return

    const list = [...slides]
    const temp = list[index]
    list[index] = list[targetIdx]
    list[targetIdx] = temp

    try {
      // Send sequential updates to database
      await Promise.all(list.map((slide, idx) =>
        apiCall(`/admin/hero/${slide.id}`, {
          method: 'PUT',
          body: JSON.stringify({ order: idx })
        })
      ))
      toast.success('Slide order updated.')
      loadSlides()
    } catch (err) {
      toast.error('Failed to update ordering in the database.')
    }
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-light text-slate-900">Hero Slides</h1>
          <p className="text-xs text-slate-500 mt-1">Configure full screen image slides shown on lookbook homepage.</p>
        </div>
        {canEdit && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-[#C6A972] hover:bg-[#d8b87e] text-slate-950 font-semibold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider transition"
          >
            <Plus size={16} /> Add Hero Slide
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-xl">
          <div className="flex justify-between items-center pb-4 mb-4 border-b">
            <h2 className="font-serif text-lg font-semibold text-slate-800">Add Hero Slide</h2>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Kicker Text (Small top heading)</label>
              <input
                required
                type="text"
                placeholder="e.g. Wardrobe Talks"
                value={form.kicker}
                onChange={e => setForm({ ...form, kicker: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Slide Heading</label>
              <input
                required
                type="text"
                placeholder="e.g. Couture, Quietly Spoken."
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Subtitle (Under Title)</label>
              <input
                type="text"
                placeholder="e.g. Crafting slow couture Indian wear."
                value={form.subtitle}
                onChange={e => setForm({ ...form, subtitle: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Upload Background Photo</label>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-[#C6A972] p-5 rounded-lg bg-slate-50 cursor-pointer transition">
                <Upload size={16} className={uploading ? 'animate-bounce text-[#C6A972]' : 'text-slate-400'} />
                <span className="text-xs text-slate-500 font-semibold">{uploading ? 'Uploading background…' : 'Choose Local File'}</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
              {form.image && (
                <div className="mt-3 relative aspect-[16/9] w-full rounded border overflow-hidden">
                  <img src={form.image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">CTA Button Label</label>
                <input
                  type="text"
                  placeholder="e.g. Explore"
                  value={form.ctaLabel}
                  onChange={e => setForm({ ...form, ctaLabel: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">CTA Navigation Target</label>
                <input
                  type="text"
                  placeholder="e.g. women"
                  value={form.ctaTarget}
                  onChange={e => setForm({ ...form, ctaTarget: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#C6A972] hover:bg-[#d8b87e] disabled:opacity-60 text-slate-950 font-bold px-5 py-2 rounded-lg text-xs uppercase tracking-wider transition"
              >
                {saving ? 'Adding slide…' : 'Create Slide'}
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="border border-slate-200 text-slate-600 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* HERO LISTING & REORDER */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slides.map((s, index) => (
            <div key={s.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col group">
              <div className="relative aspect-[16/9] bg-slate-100 border-b overflow-hidden shrink-0">
                <img src={s.image} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/45 p-4 flex flex-col justify-between text-white">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-[#C6A972] font-semibold">{s.kicker}</span>
                    <h3 className="font-serif text-base font-bold leading-snug line-clamp-1 mt-0.5">{s.title}</h3>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 border rounded text-[9px] font-bold ${
                      s.active !== false
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-slate-500/20 border-slate-400 text-slate-300'
                    }`}>{s.active !== false ? 'Active' : 'Hidden'}</span>
                    <span className="text-[10px] text-white/60">Pos: {index + 1}</span>
                  </div>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between bg-white text-xs">
                <p className="text-slate-500 line-clamp-2 leading-relaxed italic">"{s.subtitle || 'No subtitle configured'}"</p>
                {canEdit && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 items-center">
                    <button onClick={() => handleToggleActive(s)} className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 transition" title={s.active !== false ? 'Deactivate' : 'Activate'}>
                      {s.active !== false ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button disabled={index === 0} onClick={() => moveSlideOrder(index, -1)} className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 disabled:opacity-40 transition" title="Move Up"><ArrowUp size={13} /></button>
                    <button disabled={index === slides.length - 1} onClick={() => moveSlideOrder(index, 1)} className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 disabled:opacity-40 transition" title="Move Down"><ArrowDown size={13} /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-500 hover:bg-red-50 hover:border-red-200 border border-transparent rounded-lg ml-auto transition" title="Delete Slide"><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
