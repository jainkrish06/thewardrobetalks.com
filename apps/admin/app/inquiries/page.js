'use client'

import { useEffect, useState, useContext } from 'react'
import { AuthContext } from '../layout'
import { toast } from 'sonner'
import {
  HelpCircle,
  Search,
  Filter,
  Trash2,
  Calendar,
  Phone,
  Mail,
  Shirt,
  MessageSquare
} from 'lucide-react'

const STATUSES = ['NEW', 'CONTACTED', 'IN_PROGRESS', 'CLOSED']

export default function InquiriesPage() {
  const { apiCall, user } = useContext(AuthContext)
  const [inquiries, setInquiries] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const canEdit = user?.role === 'SUPER_ADMIN' || user?.role === 'INQUIRY_MANAGER'

  useEffect(() => {
    loadInquiries()
  }, [page, statusFilter])

  async function loadInquiries(q = search) {
    setLoading(true)
    try {
      let query = `?page=${page}&limit=${limit}`
      if (statusFilter) query += `&status=${statusFilter}`
      if (q) query += `&q=${encodeURIComponent(q)}`

      const res = await apiCall(`/admin/inquiries${query}`)
      if (res.success) {
        setInquiries(res.data.items || [])
        setTotal(res.data.total || 0)
      } else {
        toast.error(res.error?.message || 'Failed to load inquiries.')
      }
    } catch (err) {
      toast.error('Failed to communicate with API.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    loadInquiries(search)
  }

  const handleUpdateStatus = async (id, status) => {
    if (!canEdit) return toast.error('Access Denied. Insufficient permissions.')
    try {
      const res = await apiCall(`/admin/inquiries/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      })
      if (res.success) {
        toast.success(`Inquiry status marked as ${status}.`)
        loadInquiries()
      } else {
        toast.error(res.error?.message || 'Failed to update status.')
      }
    } catch (err) {
      toast.error('Error updating status.')
    }
  }

  const handleDelete = async (id) => {
    if (!canEdit) return toast.error('Access Denied. Insufficient permissions.')
    if (!confirm('Are you sure you want to delete this customer inquiry?')) return
    try {
      const res = await apiCall(`/admin/inquiries/${id}`, { method: 'DELETE' })
      if (res.success) {
        toast.success('Inquiry deleted.')
        loadInquiries()
      } else {
        toast.error(res.error?.message || 'Failed to delete inquiry.')
      }
    } catch (err) {
      toast.error('Error deleting inquiry.')
    }
  }

  const pages = Math.ceil(total / limit)

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-3xl font-serif font-light text-slate-900">Customer Inquiries</h1>
        <p className="text-xs text-slate-500 mt-1">Manage private lookbook design enquiries and consultation requests.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2 w-full max-w-lg">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by client name, email, or message copy..."
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
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none"
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-white border border-slate-200 rounded-xl p-6 h-40" />
          ))}
        </div>
      ) : inquiries.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
          <HelpCircle size={40} className="mx-auto text-slate-300 mb-4" />
          <h3 className="font-serif text-lg font-semibold text-slate-800 mb-1">No Inquiries Found</h3>
          <p className="text-xs text-slate-500">No visitor inquiries match the current search filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map(i => (
            <div key={i.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:border-slate-300 transition">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-serif text-lg font-semibold text-slate-800">{i.name}</h3>
                  <span className={`px-2 py-0.5 border rounded text-[9px] font-bold ${
                    i.status === 'NEW'
                      ? 'bg-amber-50 border-amber-300 text-amber-600 font-bold'
                      : i.status === 'CONTACTED'
                      ? 'bg-blue-50 border-blue-200 text-blue-600'
                      : i.status === 'IN_PROGRESS'
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                      : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}>{i.status}</span>
                </div>

                <div className="grid sm:grid-cols-3 gap-2.5 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-2"><Mail size={13} className="text-slate-400" /> <a href={`mailto:${i.email}`} className="hover:text-[#C6A972]">{i.email}</a></span>
                  {i.phone && (
                    <span className="flex items-center gap-2"><Phone size={13} className="text-slate-400" /> <a href={`tel:${i.phone}`} className="hover:text-[#C6A972]">{i.phone}</a></span>
                  )}
                  <span className="flex items-center gap-2"><Calendar size={13} className="text-slate-400" /> {new Date(i.createdAt).toLocaleString()}</span>
                </div>

                {i.productTitle && (
                  <div className="text-[11px] bg-slate-50 border border-slate-200/60 rounded-md py-1.5 px-3 inline-flex items-center gap-1.5 font-bold text-slate-700 leading-none">
                    <Shirt size={11} className="text-[#C6A972]" /> Interested in: {i.productTitle} (ID: {i.productId})
                  </div>
                )}

                <div className="bg-slate-50 border border-slate-200/30 rounded-lg p-3 text-xs leading-relaxed text-slate-600 italic font-serif flex gap-2">
                  <MessageSquare size={13} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>"{i.message}"</span>
                </div>
              </div>

              {canEdit && (
                <div className="flex flex-row md:flex-col justify-end items-center md:items-end gap-3 shrink-0 border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="flex flex-col gap-1 w-32">
                    <label className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Status tag</label>
                    <select
                      value={i.status}
                      onChange={e => handleUpdateStatus(i.id, e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 focus:outline-none"
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <button
                    onClick={() => handleDelete(i.id)}
                    className="p-2 text-red-500 hover:bg-red-50 hover:border-red-200 border border-transparent rounded-lg transition self-end"
                    title="Delete Inquiry"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
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
  )
}
