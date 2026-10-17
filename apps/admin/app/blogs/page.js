'use client'

import { useEffect, useState, useContext } from 'react'
import { AuthContext } from '../layout'
import { toast } from 'sonner'
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Eye,
  EyeOff,
  X
} from 'lucide-react'

const emptyBlog = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover: '',
  status: 'draft',
  seoTitle: '',
  seoDescription: ''
}

export default function BlogsPage() {
  const { apiCall, user } = useContext(AuthContext)
  const [blogs, setBlogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [loading, setLoading] = useState(true)

  // Editor states
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState(emptyBlog)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'CONTENT_MANAGER'

  useEffect(() => {
    loadBlogs()
  }, [page])

  async function loadBlogs() {
    setLoading(true)
    try {
      const res = await apiCall(`/admin/blogs?page=${page}&limit=${limit}`)
      if (res.success) {
        setBlogs(res.data.items || [])
        setTotal(res.data.total || 0)
      } else {
        toast.error(res.error?.message || 'Failed to load editorial articles.')
      }
    } catch (err) {
      toast.error('Failed to communicate with API.')
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
        setForm(prev => ({ ...prev, cover: data.data.url }))
        toast.success('Cover image uploaded to CDN.')
      } else {
        toast.error(data.error?.message || 'Failed to upload cover.')
      }
    } catch (err) {
      toast.error('Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleCreateNew = () => {
    if (!canEdit) return toast.error('Access Denied. Insufficient permissions.')
    setForm(emptyBlog)
    setIsEditing(true)
  }

  const handleEditClick = (b) => {
    if (!canEdit) return toast.error('Access Denied. Insufficient permissions.')
    setForm({ ...emptyBlog, ...b })
    setIsEditing(true)
  }

  const handleDelete = async (id) => {
    if (!canEdit) return toast.error('Access Denied. Insufficient permissions.')
    if (!confirm('Are you sure you want to delete this blog post?')) return
    try {
      const res = await apiCall(`/admin/blogs/${id}`, { method: 'DELETE' })
      if (res.success) {
        toast.success('Editorial post deleted.')
        loadBlogs()
      } else {
        toast.error(res.error?.message || 'Failed to delete blog post.')
      }
    } catch (err) {
      toast.error('Delete request failed.')
    }
  }

  const handleTogglePublish = async (b) => {
    if (!canEdit) return toast.error('Access Denied. Insufficient permissions.')
    const nextStatus = b.status === 'published' ? 'draft' : 'published'
    try {
      const res = await apiCall(`/admin/blogs/${b.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      })
      if (res.success) {
        toast.success(nextStatus === 'published' ? 'Article published.' : 'Article draft saved.')
        loadBlogs()
      } else {
        toast.error(res.error?.message || 'Failed to update publication status.')
      }
    } catch (err) {
      toast.error('Failed to change status.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = form.id
        ? await apiCall(`/admin/blogs/${form.id}`, {
            method: 'PUT',
            body: JSON.stringify(form)
          })
        : await apiCall('/admin/blogs', {
            method: 'POST',
            body: JSON.stringify(form)
          })

      if (res.success) {
        toast.success(form.id ? 'Article updated successfully.' : 'Article created successfully.')
        setIsEditing(false)
        setForm(emptyBlog)
        loadBlogs()
      } else {
        toast.error(res.error?.message || 'Failed to save blog post.')
      }
    } catch (err) {
      toast.error('Error saving article.')
    } finally {
      setSaving(false)
    }
  }

  const pages = Math.ceil(total / limit)

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-light text-slate-900">Journal & Editorial</h1>
          <p className="text-xs text-slate-500 mt-1">Publish luxury fashion guides, brand editorials, or behind-the-scenes diaries.</p>
        </div>
        {canEdit && !isEditing && (
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 bg-[#C6A972] hover:bg-[#d8b87e] text-slate-950 font-semibold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider transition"
          >
            <Plus size={16} /> Create Article
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm">
          <div className="flex justify-between items-center pb-4 mb-6 border-b">
            <h2 className="font-serif text-xl font-semibold text-slate-800">{form.id ? 'Edit Editorial Post' : 'Create Editorial Post'}</h2>
            <button onClick={() => { setIsEditing(false); setForm(emptyBlog); }} className="text-slate-400 hover:text-slate-600 p-1.5 border border-slate-200 rounded-lg"><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Article Title</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Ten Years of Slow Couture Heritage"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#C6A972]/80 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Custom URL Slug (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. ten-years-heritage"
                    value={form.slug}
                    onChange={e => setForm({ ...form, slug: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#C6A972]/80 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Short Excerpt / Summary</label>
                  <input
                    type="text"
                    placeholder="A brief teaser to show on the blogs list page..."
                    value={form.excerpt}
                    onChange={e => setForm({ ...form, excerpt: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#C6A972]/80 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Article Content</label>
                  <textarea
                    required
                    rows={12}
                    placeholder="Write your article story content here (markdown or plain text)..."
                    value={form.content}
                    onChange={e => setForm({ ...form, content: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#C6A972]/80 transition font-serif text-slate-700 whitespace-pre-line"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Upload Cover Image</label>
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-[#C6A972] p-5 rounded-lg bg-slate-50 cursor-pointer transition">
                    <Upload size={16} className={uploading ? 'animate-bounce text-[#C6A972]' : 'text-slate-400'} />
                    <span className="text-xs text-slate-500 font-semibold">{uploading ? 'Uploading cover…' : 'Choose Local File'}</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {form.cover && (
                    <div className="mt-3 relative aspect-[16/9] w-full rounded border overflow-hidden">
                      <img src={form.cover} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-5 space-y-4">
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-500">SEO Customization</h3>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">SEO Title Tag</label>
                    <input
                      type="text"
                      placeholder="Custom browser page title"
                      value={form.seoTitle}
                      onChange={e => setForm({ ...form, seoTitle: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Meta Description</label>
                    <textarea
                      rows={3}
                      placeholder="Brief Google snippet text..."
                      value={form.seoDescription}
                      onChange={e => setForm({ ...form, seoDescription: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t">
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value })}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-bold focus:outline-none"
                  >
                    <option value="draft">Save as Draft</option>
                    <option value="published">Publish Immediately</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#C6A972] hover:bg-[#d8b87e] disabled:opacity-60 text-slate-950 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition"
              >
                {saving ? 'Saving changes…' : 'Save Article'}
              </button>
              <button
                type="button"
                onClick={() => { setIsEditing(false); setForm(emptyBlog); }}
                className="border border-slate-200 hover:bg-slate-50 text-slate-600 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* BLOGS LIST */
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(n => <div key={n} className="bg-white border rounded-xl h-24" />)}
            </div>
          ) : blogs.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
              <BookOpen size={40} className="mx-auto text-slate-300 mb-4" />
              <h3 className="font-serif text-lg font-semibold text-slate-800 mb-1">No Articles Published</h3>
              <p className="text-xs text-slate-500 font-medium">Create your first blog post to begin the journal.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
              {blogs.map(b => (
                <div key={b.id} className="flex gap-4 p-4 items-center">
                  <img src={b.cover || 'https://placehold.co/120x80?text=Blog'} className="w-20 h-14 object-cover bg-slate-100 rounded border shrink-0" alt="" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-slate-800 line-clamp-1 leading-snug">{b.title}</h3>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{b.excerpt || 'No excerpt summary configured.'}</p>
                    <p className="text-[9px] text-[#C6A972] mt-1.5 font-semibold font-mono">/{b.slug}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleTogglePublish(b)}
                      className={`px-2 py-0.5 border rounded text-[9px] font-bold transition uppercase ${
                        b.status === 'published'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      {b.status}
                    </button>
                    {canEdit && (
                      <div className="flex gap-1">
                        <button onClick={() => handleEditClick(b)} className="p-1.5 text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 rounded-lg transition" title="Edit"><Edit2 size={13} /></button>
                        <button onClick={() => handleDelete(b.id)} className="p-1.5 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition" title="Delete"><Trash2 size={13} /></button>
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
