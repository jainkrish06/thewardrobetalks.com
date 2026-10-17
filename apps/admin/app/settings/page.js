'use client'

import { useEffect, useState, useContext } from 'react'
import { AuthContext } from '../layout'
import { toast } from 'sonner'
import { Settings, Save } from 'lucide-react'

export default function SettingsPage() {
  const { apiCall, user } = useContext(AuthContext)
  const [form, setForm] = useState({
    whatsappNumber: '',
    whatsappCommunity: '',
    instagramUrl: '',
    facebookUrl: '',
    youtubeUrl: '',
    inquiryEmail: '',
    storeAddress: '',
    storeMapsUrl: '',
    brandTagline: '',
    heroHeadline: '',
    heroSubtext: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await apiCall('/settings')
        if (res.success && res.data) {
          setForm(prev => ({ ...prev, ...res.data }))
        }
      } catch (err) {
        toast.error('Failed to load website settings.')
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isSuperAdmin) return toast.error('Access Denied. Only Super Admins can save site configurations.')
    setSaving(true)
    try {
      const res = await apiCall('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(form)
      })
      if (res.success) {
        toast.success('Website configurations saved and cached successfully.')
      } else {
        toast.error(res.error?.message || 'Failed to save settings.')
      }
    } catch (err) {
      toast.error('Error saving settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <h1 className="text-2xl font-serif font-bold text-slate-900">Website Settings</h1>
        <div className="bg-white border rounded-xl h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-serif font-light text-slate-900">Website Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Configure WhatsApp links, social accounts, physical showroom coordinates and copy taglines.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b">
          <Settings className="text-[#C6A972]" size={18} />
          <h2 className="font-serif text-base font-semibold text-slate-800">Atelier Settings</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">WhatsApp Contact (with country code)</label>
            <input
              required
              type="text"
              placeholder="e.g. +919885525611"
              value={form.whatsappNumber}
              disabled={!isSuperAdmin}
              onChange={e => setForm({ ...form, whatsappNumber: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">WhatsApp Community link</label>
            <input
              type="text"
              placeholder="https://chat.whatsapp.com/..."
              value={form.whatsappCommunity}
              disabled={!isSuperAdmin}
              onChange={e => setForm({ ...form, whatsappCommunity: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition disabled:opacity-60"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Instagram Account URL</label>
            <input
              type="text"
              placeholder="https://instagram.com/username"
              value={form.instagramUrl}
              disabled={!isSuperAdmin}
              onChange={e => setForm({ ...form, instagramUrl: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Inquiry Recipient Email</label>
            <input
              type="email"
              placeholder="owner@thewardrobetalks.com"
              value={form.inquiryEmail}
              disabled={!isSuperAdmin}
              onChange={e => setForm({ ...form, inquiryEmail: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition disabled:opacity-60"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Facebook URL (Optional)</label>
            <input
              type="text"
              placeholder="https://facebook.com/..."
              value={form.facebookUrl}
              disabled={!isSuperAdmin}
              onChange={e => setForm({ ...form, facebookUrl: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">YouTube URL (Optional)</label>
            <input
              type="text"
              placeholder="https://youtube.com/..."
              value={form.youtubeUrl}
              disabled={!isSuperAdmin}
              onChange={e => setForm({ ...form, youtubeUrl: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Showroom Physical Address</label>
          <textarea
            rows={2}
            placeholder="Showroom physical address"
            value={form.storeAddress}
            disabled={!isSuperAdmin}
            onChange={e => setForm({ ...form, storeAddress: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1.5">Google Maps Pin Location URL</label>
          <input
            type="text"
            placeholder="https://google.com/maps/..."
            value={form.storeMapsUrl}
            disabled={!isSuperAdmin}
            onChange={e => setForm({ ...form, storeMapsUrl: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition disabled:opacity-60"
          />
        </div>

        <div className="border-t border-slate-100 pt-5 space-y-4">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-500">Homepage Copies</h3>
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Brand Tagline</label>
            <input
              type="text"
              placeholder="e.g. Where threads tell stories."
              value={form.brandTagline}
              disabled={!isSuperAdmin}
              onChange={e => setForm({ ...form, brandTagline: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Hero Main Headline</label>
            <input
              type="text"
              placeholder="e.g. Couture, Quietly Spoken."
              value={form.heroHeadline}
              disabled={!isSuperAdmin}
              onChange={e => setForm({ ...form, heroHeadline: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Hero Subtext</label>
            <input
              type="text"
              placeholder="A Mumbai atelier crafting heirloom Indian wear."
              value={form.heroSubtext}
              disabled={!isSuperAdmin}
              onChange={e => setForm({ ...form, heroSubtext: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#C6A972]/80 transition disabled:opacity-60"
            />
          </div>
        </div>

        {isSuperAdmin ? (
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 bg-[#C6A972] hover:bg-[#d8b87e] disabled:opacity-60 text-slate-950 font-bold px-6 py-3 rounded-lg text-xs uppercase tracking-wider transition"
          >
            <Save size={14} /> {saving ? 'Saving Configurations…' : 'Save Configurations'}
          </button>
        ) : (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 p-3 rounded-lg">Only Super Admin accounts can edit global settings.</p>
        )}
      </form>
    </div>
  )
}
