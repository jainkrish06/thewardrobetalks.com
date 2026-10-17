'use client'

import { useEffect, useState, useContext } from 'react'
import { AuthContext } from '../layout'
import { toast } from 'sonner'
import {
  ImageIcon,
  Plus,
  Trash2,
  Upload,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  X,
  Edit2
} from 'lucide-react'

export default function DailyAtelierPage() {
  const { apiCall, user } = useContext(AuthContext)
  const [gallery, setGallery] = useState([])
  const [loading, setLoading] = useState(true)

  // Editor states
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({ id: '', image: '', caption: '', alt: '', link: '', published: true })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'CONTENT_MANAGER'

  useEffect(() => {
    loadGallery()
  }, [])

  async function loadGallery() {
    setLoading(true)
    try {
      const res = await apiCall('/admin/gallery')
      if (res.success) {
        setGallery(res.data || [])
      } else {
        toast.error(res.error?.message || 'Failed to load Daily Atelier items.')
      }
    } catch (err) {
      toast.error('Failed to connect to API.')
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
        toast.success('Atelier image uploaded to Cloudinary CDN.')
      } else {
        toast.error(data.error?.message || 'Failed to upload image.')
      }
    } catch (err) {
      toast.error('Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleEditClick = (g) => {
    if (!canEdit) return toast.error('Access Denied. Insufficient permissions.')
    setForm(g)
    setIsEditing(true)
  }

  const handleCreateNew = () => {
    if (!canEdit) return toast.error('Access Denied. Insufficient permissions.')
    setForm({ id: '', image: '', caption: '', alt: '', link: '', published: true })
    setIsEditing(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.image) return toast.error('Gallery image is required.')
    setSaving(true)
    try {
      const res = form.id
        ? await apiCall(`/admin/gallery/${form.id}`, {
            method: 'PUT',
            body: JSON.stringify(form)
          })
        : await apiCall('/admin/gallery', {
            method: 'POST',
            body: JSON.stringify(form)
          })

      if (res.success) {
        toast.success(form.id ? 'Item updated successfully.' : 'Item created successfully.')
        setIsEditing(false)
        setForm({ id: '', image: '', caption: '', alt: '', link: '', published: true })
        loadGallery()
      } else {
        toast.error(res.error?.message || 'Failed to save item.')
      }
    } catch (err) {
      toast.error('Error saving item.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!canEdit) return toast.error('Access Denied. Insufficient permissions.')
    if (!confirm('Are you sure you want to delete this Atelier item?')) return
    try {
      const res = await apiCall(`/admin/gallery/${id}`, { method: 'DELETE' })
      if (res.success) {
        toast.success('Atelier item deleted.')
        loadGallery()
      } else {
        toast.error(res.error?.message || 'Failed to delete item.')
      }
    } catch (err) {
      toast.error('Delete request failed.')
    }
  }

  const handleTogglePublished = async (g) => {
    if (!canEdit) return toast.error('Access Denied. Insufficient permissions.')
    try {
      const res = await apiCall(`/admin/gallery/${g.id}`, {
        method: 'PUT',
        body: JSON.stringify({ published: !g.published })
      })
      if (res.success) {
        toast.success(g.published ? 'Atelier item hidden.' : 'Atelier item published.')
        loadGallery()
      } else {
        toast.error(res.error?.message || 'Failed to update item status.')
      }
    } catch (err) {
      toast.error('Failed to update status.')
    }
  }

  const moveOrder = async (index, direction) => {
    if (!canEdit) return toast.error('Access Denied. Insufficient permissions.')
    const targetIdx = index + direction
    if (targetIdx < 0 || targetIdx >= gallery.length) return

    const list = [...gallery]
    const temp = list[index]
    list[index] = list[targetIdx]
    list[targetIdx] = temp

    try {
      await Promise.all(list.map((item, idx) =>
        apiCall(`/admin/gallery/${item.id}`, {
          method: 'PUT',
          body: JSON.stringify({ order: idx })
        })
      ))
      toast.success('Gallery reordered.')
      loadGallery()
    } catch (err) {
      toast.error('Failed to update reorder positions.')
    }
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-light text-slate-900">Daily Atelier Gallery</h1>
          <p className="text-xs text-slate-500 mt-1">Manage the Instagram-style masonry grid showcasing daily workshop crafts.</p>
        </div>
        {canEdit && !isEditing && (
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-[#C6A972] hover:bg-[#d8b87e] text-slate-950 font-semibold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider transition"
          >
            <Plus size={16} /> Add Atelier Image
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-xl">
          <div className="flex justify-between items-center pb-4 mb-4 border-b">
            <h2 className="font-serif text-lg font-semibold text-slate-800">{form.id ? 'Edit Atelier Item' : 'Add Atelier Item'}</h2>
            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Upload Background Photo</label>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-[#C6A972] p-5 rounded-lg bg-slate-50 cursor-pointer transition">
                <Upload size={16} className={uploading ? 'animate-bounce text-[#C6A972]' : 'text-slate-400'} />
                <span className="text-xs text-slate-500 font-semibold">{uploading ? 'Uploading background…' : 'Choose Local File'}</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
              {form.image && (
                <div className="mt-3 relative aspect-square w-full max-w-[200px] rounded border overflow-hidden mx-auto">
                  <img src={form.image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Caption text</label>
              <input
                type="text"
                placeholder="e.g. Draping a tissue silk saree."
                value={form.caption}
                onChange={e => setForm({ ...form, caption: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Image Alt Text (for accessibility)</label>
              <input
                type="text"
                placeholder="Alt description"
                value={form.alt}
                onChange={e => setForm({ ...form, alt: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Instagram Post Link (Optional)</label>
              <input
                type="text"
                placeholder="e.g. instagram.com/p/..."
                value={form.link}
                onChange={e => setForm({ ...form, link: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="gallery-published"
                checked={form.published}
                onChange={e => setForm({ ...form, published: e.target.checked })}
                className="accent-[#C6A972] w-4 h-4"
              />
              <label htmlFor="gallery-published" className="text-xs font-semibold text-slate-700 select-none">Publish to Website</label>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#C6A972] hover:bg-[#d8b87e] disabled:opacity-60 text-slate-950 font-bold px-5 py-2 rounded-lg text-xs uppercase tracking-wider transition"
              >
                {saving ? 'Saving changes…' : 'Save Item'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="border border-slate-200 text-slate-600 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* GALLERY GRID */
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          {gallery.map((g, index) => (
            <div key={g.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col group relative">
              <div className="relative aspect-square bg-slate-100 border-b overflow-hidden shrink-0">
                <img src={g.image} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-3 text-white">
                  <span className="text-[9px] uppercase tracking-widest text-[#C6A972] font-semibold block line-clamp-2">Caption: {g.caption || 'N/A'}</span>
                  <div className="flex gap-1.5 justify-end">
                    <button onClick={() => handleEditClick(g)} className="p-1 text-white hover:text-[#C6A972] hover:bg-white/10 rounded transition" title="Edit"><Edit2 size={13} /></button>
                    <button onClick={() => handleDelete(g.id)} className="p-1 text-red-400 hover:bg-red-500/20 rounded transition" title="Delete"><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
              <div className="p-2.5 flex justify-between items-center text-[10px] bg-slate-50 shrink-0">
                <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${
                  g.published !== false
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}>{g.published !== false ? 'Published' : 'Hidden'}</span>
                {canEdit && (
                  <div className="flex gap-1">
                    <button disabled={index === 0} onClick={() => moveOrder(index, -1)} className="p-0.5 border border-slate-200 hover:bg-white text-slate-500 rounded disabled:opacity-40" title="Move Left"><ArrowLeft size={10} /></button>
                    <button disabled={index === gallery.length - 1} onClick={() => moveOrder(index, 1)} className="p-0.5 border border-slate-200 hover:bg-white text-slate-500 rounded disabled:opacity-40" title="Move Right"><ArrowRight size={10} /></button>
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
