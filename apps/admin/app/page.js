'use client'

import { useEffect, useState, useContext } from 'react'
import { AuthContext } from './layout'
import {
  Shirt,
  HelpCircle,
  BookOpen,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  ArrowRight
} from 'lucide-react'

export default function DashboardHome() {
  const { apiCall } = useContext(AuthContext)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await apiCall('/admin/dashboard/stats')
        if (res.success) {
          setStats(res.data)
        } else {
          setError(res.error?.message || 'Failed to load dashboard metrics.')
        }
      } catch (err) {
        setError('Connection failed. Verify if the API server is running.')
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-serif font-bold text-slate-900 animate-pulse">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-white p-6 border border-slate-200 rounded-xl h-28 animate-pulse" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 border border-slate-200 rounded-xl h-96 animate-pulse" />
          <div className="bg-white p-6 border border-slate-200 rounded-xl h-96 animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-6 rounded-xl max-w-2xl">
        <h2 className="text-red-800 font-bold text-lg mb-2">Error Loading Dashboard</h2>
        <p className="text-red-700 text-sm mb-4 leading-relaxed">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-800 hover:bg-red-950 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition">Retry Connection</button>
      </div>
    )
  }

  const cards = [
    { label: 'Total Products', val: stats.totalProducts, icon: Shirt, color: 'text-blue-500 bg-blue-50' },
    { label: 'Total Collections', val: stats.totalCollections, icon: FolderOpen, color: 'text-violet-500 bg-violet-50' },
    { label: 'Total Inquiries', val: stats.totalInquiries, icon: HelpCircle, color: 'text-emerald-500 bg-emerald-50' },
    { label: 'New Inquiries', val: stats.newInquiries, icon: AlertTriangle, color: stats.newInquiries > 0 ? 'text-amber-500 bg-amber-50 border border-amber-300' : 'text-slate-500 bg-slate-50' },
    { label: 'Published Blogs', val: stats.publishedBlogs, icon: BookOpen, color: 'text-pink-500 bg-pink-50' },
    { label: 'Gallery Images', val: stats.galleryImages, icon: ImageIcon, color: 'text-orange-500 bg-orange-50' }
  ]

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div>
        <h1 className="text-3xl font-serif font-light text-slate-900">Atelier Overview</h1>
        <p className="text-xs text-slate-500 mt-1">Real-time statistics and administrative status updates.</p>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white p-5 border border-slate-200/80 rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-2xl font-bold font-serif text-slate-800">{c.val}</span>
              <div className={`p-2 rounded-lg ${c.color}`}>
                <c.icon size={16} />
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-400 mt-4 leading-none">{c.label}</span>
          </div>
        ))}
      </div>

      {/* SYSTEM STATUS */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
        <h2 className="font-serif text-base font-semibold text-slate-800 mb-4">Integrations Status</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/40">
            <CheckCircle2 className="text-emerald-500" size={18} />
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase leading-none">Database Status</p>
              <p className="text-xs font-bold text-slate-700 mt-1">{stats.systemStatus?.database || 'CONNECTED'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/40">
            <CheckCircle2 className={stats.systemStatus?.cloudinary === 'CONFIGURED' ? 'text-emerald-500' : 'text-amber-500'} size={18} />
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase leading-none">Cloudinary CDN</p>
              <p className="text-xs font-bold text-slate-700 mt-1">{stats.systemStatus?.cloudinary === 'CONFIGURED' ? 'CONFIGURED' : 'NOT CONFIGURED'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/40">
            <CheckCircle2 className={stats.systemStatus?.smtp === 'CONFIGURED' ? 'text-emerald-500' : 'text-amber-500'} size={18} />
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase leading-none">SMTP Email Alert</p>
              <p className="text-xs font-bold text-slate-700 mt-1">{stats.systemStatus?.smtp === 'CONFIGURED' ? 'CONFIGURED' : 'NOT CONFIGURED'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* RECENT INQUIRIES */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
            <h2 className="font-serif text-lg font-semibold text-slate-800">Recent Customer Inquiries</h2>
            <a href="/inquiries" className="text-xs font-semibold text-[#C6A972] flex items-center gap-1 hover:gap-2 transition-all">All Inquiries <ArrowRight size={12} /></a>
          </div>
          {stats.recentInquiries?.length === 0 ? (
            <p className="text-xs text-slate-400 font-serif italic py-10 text-center">No inquiry logs recorded.</p>
          ) : (
            <div className="flex-1 space-y-4">
              {stats.recentInquiries?.map(i => (
                <div key={i.id} className="text-xs flex flex-col gap-1.5 p-3.5 bg-slate-50 border border-slate-200/40 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{i.name}</span>
                    <span className={`px-2 py-0.5 font-bold uppercase border rounded text-[9px] ${
                      i.status === 'NEW'
                        ? 'bg-amber-50 border-amber-300 text-amber-600'
                        : i.status === 'CONTACTED'
                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                        : i.status === 'IN_PROGRESS'
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}>{i.status}</span>
                  </div>
                  <p className="text-slate-400 text-[10px]">{i.email} · {i.phone || 'No phone'}</p>
                  <p className="text-slate-600 italic font-serif mt-1 border-t border-slate-200/30 pt-1.5 leading-relaxed">"{i.message}"</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RECENT DESIGNS */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
            <h2 className="font-serif text-lg font-semibold text-slate-800">Recent Lookbook Additions</h2>
            <a href="/products" className="text-xs font-semibold text-[#C6A972] flex items-center gap-1 hover:gap-2 transition-all">All Products <ArrowRight size={12} /></a>
          </div>
          {stats.recentProducts?.length === 0 ? (
            <p className="text-xs text-slate-400 font-serif italic py-10 text-center">No lookbook pieces configured yet.</p>
          ) : (
            <div className="flex-1 space-y-3">
              {stats.recentProducts?.map(p => (
                <div key={p.id} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200/40 rounded-lg hover:border-[#C6A972]/30 transition">
                  <div className="flex items-center gap-3">
                    <img src={p.images?.[0] || 'https://placehold.co/100x100?text=WT'} alt="" className="w-9 h-11 object-cover bg-slate-200 rounded border border-slate-200/60" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 leading-tight">{p.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1">{p.category} · {p.subcategory}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded uppercase">{p.fabric || 'Fabric N/A'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
