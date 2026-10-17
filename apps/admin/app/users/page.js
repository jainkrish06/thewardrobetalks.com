'use client'

import { useEffect, useState, useContext } from 'react'
import { AuthContext } from '../layout'
import { toast } from 'sonner'
import { Users, Plus, Trash2, Shield, X } from 'lucide-react'

const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin (All permissions)' },
  { value: 'CONTENT_MANAGER', label: 'Content Manager (Products, Blogs, Slides, Gallery)' },
  { value: 'INQUIRY_MANAGER', label: 'Inquiry Manager (View and manage customer inquiries)' }
]

export default function AdminUsersPage() {
  const { apiCall, user } = useContext(AuthContext)
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [isAdding, setIsAdding] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CONTENT_MANAGER' })
  const [saving, setSaving] = useState(false)

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  useEffect(() => {
    if (isSuperAdmin) {
      loadAdmins()
    }
  }, [])

  async function loadAdmins() {
    setLoading(true)
    try {
      const res = await apiCall('/admin/users')
      if (res.success) {
        setAdmins(res.data || [])
      } else {
        toast.error(res.error?.message || 'Failed to retrieve admin accounts.')
      }
    } catch (err) {
      toast.error('Failed to communicate with API.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.')
    setSaving(true)
    try {
      const res = await apiCall('/admin/users', {
        method: 'POST',
        body: JSON.stringify(form)
      })
      if (res.success) {
        toast.success('Admin account created successfully.')
        setIsAdding(false)
        setForm({ name: '', email: '', password: '', role: 'CONTENT_MANAGER' })
        loadAdmins()
      } else {
        toast.error(res.error?.message || 'Failed to create user.')
      }
    } catch (err) {
      toast.error('Error creating user account.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (id === user.id) return toast.error('You cannot delete your own admin account.')
    if (!confirm('Are you sure you want to delete this administrator account?')) return
    try {
      const res = await apiCall(`/admin/users/${id}`, { method: 'DELETE' })
      if (res.success) {
        toast.success('Admin account deleted.')
        loadAdmins()
      } else {
        toast.error(res.error?.message || 'Failed to delete account.')
      }
    } catch (err) {
      toast.error('Delete request failed.')
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl max-w-xl">
        <h2 className="text-amber-800 font-bold text-lg mb-2">Access Denied</h2>
        <p className="text-amber-700 text-xs leading-relaxed">Only Super Admin accounts can view or modify administrators.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <h1 className="text-2xl font-serif font-bold text-slate-900 font-serif">Admin Users</h1>
        <div className="bg-white border rounded-xl h-60" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-light text-slate-900">Admin Accounts</h1>
          <p className="text-xs text-slate-500 mt-1">Provision and manage internal administrator roles and credentials.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-[#C6A972] hover:bg-[#d8b87e] text-slate-950 font-semibold px-4 py-2.5 rounded-lg text-xs uppercase tracking-wider transition"
          >
            <Plus size={16} /> Add Admin User
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-md">
          <div className="flex justify-between items-center pb-4 mb-4 border-b">
            <h2 className="font-serif text-lg font-semibold text-slate-800">Add Admin Account</h2>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Full Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Aanya Kapoor"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Email Address</label>
              <input
                required
                type="email"
                placeholder="email@thewardrobetalks.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Initial Password (Min 6 chars)</label>
              <input
                required
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Administrator Role</label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-[#C6A972]/80"
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#C6A972] hover:bg-[#d8b87e] disabled:opacity-60 text-slate-950 font-bold px-5 py-2 rounded-lg text-xs uppercase tracking-wider transition"
              >
                {saving ? 'Creating user…' : 'Create User'}
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
        /* ADMINS LOG LIST */
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm divide-y divide-slate-100">
          {admins.map(a => (
            <div key={a.id} className="flex justify-between items-center p-4">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-2.5 rounded-lg text-slate-500">
                  <Shield size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    {a.name}
                    <span className="bg-slate-100 text-slate-500 font-mono font-bold px-1.5 py-0.5 rounded text-[8px] tracking-wider">{a.role}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">{a.email}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(a.id)}
                className="p-2 text-red-500 hover:bg-red-50 hover:border-red-200 border border-transparent rounded-lg transition"
                title="Remove Admin Account"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
