'use client'

import { useEffect, useState, useContext } from 'react'
import { AuthContext } from '../layout'
import { toast } from 'sonner'
import {
  Shirt,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Copy,
  ChevronUp,
  ChevronDown,
  Upload,
  Star,
  CheckCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  X
} from 'lucide-react'

const emptyProduct = {
  title: '',
  slug: '',
  description: '',
  category: 'Women',
  subcategory: 'Bridal Lehenga',
  fabric: '',
  occasion: '',
  designerNotes: '',
  images: [],
  featured: false,
  published: true,
  displayOrder: 999,
  seoTitle: '',
  seoDescription: ''
}

const CATEGORIES = ['Women', 'Men', 'Celebrity']

export default function ProductsPage() {
  const { apiCall, user } = useContext(AuthContext)
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(12)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(true)

  // Editor states
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState(emptyProduct)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'CONTENT_MANAGER'

  useEffect(() => {
    loadProducts()
  }, [page, categoryFilter])

  async function loadProducts(q = search) {
    setLoading(true)
    try {
      let query = `?page=${page}&limit=${limit}`
      if (categoryFilter) query += `&category=${categoryFilter}`
      if (q) query += `&q=${encodeURIComponent(q)}`

      const res = await apiCall(`/admin/products${query}`)
      if (res.success) {
        setProducts(res.data.items || [])
        setTotal(res.data.total || 0)
      } else {
        toast.error(res.error?.message || 'Failed to retrieve products list.')
      }
    } catch (err) {
      toast.error('Error contacting the API backend.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    loadProducts(search)
  }

  const handleCreateNew = () => {
    if (!canEdit) return toast.error('Access Denied. Insufficient permissions.')
    setForm(emptyProduct)
    setIsEditing(true)
  }

  const handleEditClick = (p) => {
    if (!canEdit) return toast.error('Access Denied. Insufficient permissions.')
    setForm({ ...emptyProduct, ...p })
    setIsEditing(true)
  }

  const handleDuplicateClick = (p) => {
    if (!canEdit) return toast.error('Access Denied. Insufficient permissions.')
    const { id, _id, createdAt, updatedAt, slug, ...rest } = p
    setForm({
      ...rest,
      title: `${p.title} (Copy)`,
      slug: slug ? `${slug}-copy` : '',
      featured: false
    })
    setIsEditing(true)
    toast.info('Adjust title and details for the duplicated design.')
  }

  const handleDeleteClick = async (id) => {
    if (!canEdit) return toast.error('Access Denied. Insufficient permissions.')
    if (!confirm('Are you sure you want to delete this design? This action cannot be undone.')) return
    try {
      const res = await apiCall(`/admin/products/${id}`, { method: 'DELETE' })
      if (res.success) {
        toast.success('Product deleted successfully.')
        loadProducts()
      } else {
        toast.error(res.error?.message || 'Failed to delete product.')
      }
    } catch (err) {
      toast.error('Delete request failed.')
    }
  }

  const handleTogglePublish = async (p) => {
    if (!canEdit) return toast.error('Access Denied. Insufficient permissions.')
    try {
      const res = await apiCall(`/admin/products/${p.id}`, {
        method: 'PUT',
        body: JSON.stringify({ published: !p.published })
      })
      if (res.success) {
        toast.success(p.published ? 'Product unpublished' : 'Product published successfully.')
        loadProducts()
      } else {
        toast.error(res.error?.message || 'Failed to update publication status.')
      }
    } catch (err) {
      toast.error('Failed to change status.')
    }
  }

  const handleToggleFeatured = async (p) => {
    if (!canEdit) return toast.error('Access Denied. Insufficient permissions.')
    try {
      const res = await apiCall(`/admin/products/${p.id}`, {
        method: 'PUT',
        body: JSON.stringify({ featured: !p.featured })
      })
      if (res.success) {
        toast.success(p.featured ? 'Removed from signatures' : 'Set as Signature collection successfully.')
        loadProducts()
      } else {
        toast.error(res.error?.message || 'Failed to update featured status.')
      }
    } catch (err) {
      toast.error('Failed to change status.')
    }
  }

  // File Upload to Cloudinary Handler
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
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      const data = await res.json()
      if (data.success && data.data?.url) {
        setForm(prev => ({
          ...prev,
          images: [...(prev.images || []), data.data.url]
        }))
        toast.success('Image uploaded to Cloudinary CDN.')
      } else {
        toast.error(data.error?.message || 'Failed to upload image.')
      }
    } catch (err) {
      toast.error('Image upload failed. Check file types or sizes (Max 10MB).')
    } finally {
      setUploading(false)
    }
  }

  // Image Reordering
  const moveImage = (index, direction) => {
    const nextImages = [...(form.images || [])]
    const targetIdx = index + direction
    if (targetIdx < 0 || targetIdx >= nextImages.length) return
    const temp = nextImages[index]
    nextImages[index] = nextImages[targetIdx]
    nextImages[targetIdx] = temp
    setForm(prev => ({ ...prev, images: nextImages }))
  }

  const deleteFormImage = (index) => {
    const nextImages = form.images.filter((_, i) => i !== index)
    setForm(prev => ({ ...prev, images: nextImages }))
  }

  const makeCoverImage = (index) => {
    const nextImages = [...form.images]
    const cover = nextImages.splice(index, 1)[0]
    nextImages.unshift(cover) // Put at the beginning
    setForm(prev => ({ ...prev, images: nextImages }))
    toast.info('Image selected as primary lookbook cover.')
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = form.id
        ? await apiCall(`/admin/products/${form.id}`, {
            method: 'PUT',
            body: JSON.stringify(form)
          })
        : await apiCall('/admin/products', {
            method: 'POST',
            body: JSON.stringify(form)
          })

      if (res.success) {
        toast.success(form.id ? 'Product updated successfully.' : 'Product created successfully.')
        setIsEditing(false)
        setForm(emptyProduct)
        loadProducts()
      } else {
        toast.error(res.error?.message || 'Failed to save product.')
      }
    } catch (err) {
      toast.error('Error saving product.')
    } finally {
      setSaving(false)
    }
  }

  const pages = Math.ceil(total / limit)

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-light text-slate-900">Lookbook Designs</h1>
          <p className="text-xs text-slate-500 mt-1">Manage luxury couture products, tags, descriptions and photos.</p>
        </div>
        {canEdit && !isEditing && (
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-[#C6A972] hover:bg-[#d8b87e] text-slate-950 font-semibold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider transition"
          >
            <Plus size={16} /> Add New Design
          </button>
        )}
      </div>

      {isEditing ? (
        /* PRODUCT EDITOR FORM */
        <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm">
          <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-100">
            <h2 className="font-serif text-xl font-semibold text-slate-800">{form.id ? 'Modify Couture Design' : 'Add Luxury Design'}</h2>
            <button
              onClick={() => { setIsEditing(false); setForm(emptyProduct); }}
              className="text-slate-400 hover:text-slate-600 p-1.5 border border-slate-200 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Design Title</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Ivory Zardozi Lehenga"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#C6A972]/80 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Custom Slug (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. ivory-zardozi-lehenga"
                    value={form.slug}
                    onChange={e => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#C6A972]/80 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Main Category</label>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-[#C6A972]/80 transition"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Subcategory</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Bridal Lehenga"
                      value={form.subcategory}
                      onChange={e => setForm({ ...form, subcategory: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#C6A972]/80 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Fabric</label>
                    <input
                      type="text"
                      placeholder="Silk, Georgette"
                      value={form.fabric}
                      onChange={e => setForm({ ...form, fabric: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#C6A972]/80 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Occasion</label>
                    <input
                      type="text"
                      placeholder="Wedding, Sangeet"
                      value={form.occasion}
                      onChange={e => setForm({ ...form, occasion: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#C6A972]/80 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Display Order</label>
                    <input
                      type="number"
                      placeholder="999"
                      value={form.displayOrder}
                      onChange={e => setForm({ ...form, displayOrder: parseInt(e.target.value, 10) || 999 })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#C6A972]/80 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Description</label>
                  <textarea
                    rows={4}
                    placeholder="Describe the silhouette, embroidery details, and craftsmanship..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#C6A972]/80 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Designer's Note / Atelier Quote</label>
                  <textarea
                    rows={2}
                    placeholder="A personal detail about this piece..."
                    value={form.designerNotes}
                    onChange={e => setForm({ ...form, designerNotes: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#C6A972]/80 transition"
                  />
                </div>
              </div>

              {/* IMAGE MANAGER & SEO */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Image Upload (Cloudinary CDN)</label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-[#C6A972] p-6 rounded-lg bg-slate-50 cursor-pointer transition">
                      <Upload size={20} className={uploading ? 'animate-bounce text-[#C6A972]' : 'text-slate-400'} />
                      <span className="text-xs text-slate-500 font-semibold">{uploading ? 'Uploading to CDN…' : 'Choose Local File'}</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                {form.images?.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400">Manage Uploaded Images ({form.images.length})</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                      {form.images.map((src, index) => (
                        <div key={index} className="bg-slate-50 p-2.5 border border-slate-200 rounded-lg flex items-center gap-3 relative group">
                          <img src={src} className="w-12 h-16 object-cover bg-slate-200 rounded border" alt="" />
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 block leading-none mb-1">Index: {index} {index === 0 && ' (Cover)'}</span>
                            <div className="flex gap-1.5 mt-2">
                              {index > 0 && (
                                <button type="button" onClick={() => makeCoverImage(index)} className="text-[10px] font-bold bg-white hover:bg-slate-100 text-[#C6A972] border border-[#C6A972]/30 px-1.5 py-0.5 rounded transition">Set Cover</button>
                              )}
                              <button type="button" disabled={index === 0} onClick={() => moveImage(index, -1)} className="p-1 bg-white hover:bg-slate-100 border text-slate-500 rounded disabled:opacity-40"><ChevronUp size={11} /></button>
                              <button type="button" disabled={index === form.images.length - 1} onClick={() => moveImage(index, 1)} className="p-1 bg-white hover:bg-slate-100 border text-slate-500 rounded disabled:opacity-40"><ChevronDown size={11} /></button>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteFormImage(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 border border-transparent hover:border-red-200 rounded-lg absolute top-2 right-2"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-5 space-y-4">
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-500">SEO Meta Tags (Optional)</h3>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">SEO Title Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. Buy Royal Silk Palazzo | Wardrobe Talks"
                      value={form.seoTitle}
                      onChange={e => setForm({ ...form, seoTitle: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Meta Description</label>
                    <textarea
                      rows={2}
                      placeholder="A search engine meta snippet description..."
                      value={form.seoDescription}
                      onChange={e => setForm({ ...form, seoDescription: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition"
                    />
                  </div>
                </div>

                <div className="flex gap-4 border-t border-slate-100 pt-5">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="form-featured"
                      checked={form.featured}
                      onChange={e => setForm({ ...form, featured: e.target.checked })}
                      className="accent-[#C6A972] w-4 h-4"
                    />
                    <label htmlFor="form-featured" className="text-xs font-semibold text-slate-700 select-none">Signature Featured</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="form-published"
                      checked={form.published}
                      onChange={e => setForm({ ...form, published: e.target.checked })}
                      className="accent-[#C6A972] w-4 h-4"
                    />
                    <label htmlFor="form-published" className="text-xs font-semibold text-slate-700 select-none">Published to Website</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#C6A972] hover:bg-[#d8b87e] disabled:opacity-60 text-slate-950 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition"
              >
                {saving ? 'Saving changes…' : 'Save Design'}
              </button>
              <button
                type="button"
                onClick={() => { setIsEditing(false); setForm(emptyProduct); }}
                className="border border-slate-200 hover:bg-slate-50 text-slate-600 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* PRODUCTS LISTING & SEARCH */
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full max-w-lg">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search design title, descriptions, or fabric..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition text-slate-700"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition">Search</button>
            </form>
            <div className="flex gap-2 items-center w-full md:w-auto">
              <Filter size={14} className="text-slate-400" />
              <select
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <div key={n} className="bg-white border border-slate-200 rounded-xl aspect-[3/4] h-72" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
              <Shirt size={40} className="mx-auto text-slate-300 mb-4" />
              <h3 className="font-serif text-lg font-semibold text-slate-800 mb-1">No Couture Designs Found</h3>
              <p className="text-xs text-slate-500">Try modifying your search or select another category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {products.map(p => (
                <div key={p.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col group hover:shadow-md transition">
                  <div className="relative aspect-[3/4] bg-slate-100 overflow-hidden shrink-0 border-b border-slate-200/60">
                    <img src={p.images?.[0] || 'https://placehold.co/300x400?text=Atelier'} className="w-full h-full object-cover transition-transform group-hover:scale-102" alt="" />
                    <div className="absolute top-2.5 left-2.5 flex gap-1">
                      {p.featured && (
                        <span className="bg-amber-500 text-slate-950 p-1.5 rounded-full shadow-md text-xs" title="Featured Signature"><Star size={11} fill="currentColor" /></span>
                      )}
                      {p.published ? (
                        <span className="bg-emerald-500 text-white p-1.5 rounded-full shadow-md text-xs" title="Published to Web"><Eye size={11} /></span>
                      ) : (
                        <span className="bg-slate-500 text-white p-1.5 rounded-full shadow-md text-xs" title="Draft / Hidden"><EyeOff size={11} /></span>
                      )}
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#C6A972] tracking-wider uppercase block">{p.subcategory}</span>
                      <h3 className="text-xs font-bold text-slate-800 mt-1 line-clamp-1 leading-snug">{p.title}</h3>
                      <p className="text-[10px] text-slate-400 leading-normal mt-1.5 line-clamp-2">{p.description}</p>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1.5 mt-4 pt-3 border-t border-slate-100">
                        <button onClick={() => handleEditClick(p)} className="p-1.5 text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 rounded-lg transition" title="Edit Design"><Edit2 size={13} /></button>
                        <button onClick={() => handleDuplicateClick(p)} className="p-1.5 text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 rounded-lg transition" title="Duplicate"><Copy size={13} /></button>
                        <button onClick={() => handleTogglePublish(p)} className="p-1.5 text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 rounded-lg transition" title={p.published ? 'Unpublish' : 'Publish'}>{p.published ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                        <button onClick={() => handleToggleFeatured(p)} className="p-1.5 text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 rounded-lg transition" title={p.featured ? 'Unfeature' : 'Feature'}>{p.featured ? <Star size={13} /> : <Star size={13} className="text-[#C6A972]" fill="none" />}</button>
                        <button onClick={() => handleDeleteClick(p.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg ml-auto transition" title="Delete"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PAGINATION PANEL */}
          {pages > 1 && (
            <div className="flex justify-center gap-1.5 mt-8">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="px-3.5 py-1.5 border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg disabled:opacity-40 transition"
              >
                Previous
              </button>
              {[...Array(pages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 text-xs font-semibold rounded-lg border transition ${
                    page === i + 1
                      ? 'bg-slate-800 border-slate-800 text-white font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={page === pages}
                onClick={() => setPage(p => Math.min(p + 1, pages))}
                className="px-3.5 py-1.5 border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
