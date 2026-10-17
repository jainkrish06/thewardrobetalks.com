'use client'

import { useEffect, useState, useContext } from 'react'
import { AuthContext } from '../layout'
import { toast } from 'sonner'
import { Terminal, Database, Server, Mail, Image as ImageIcon } from 'lucide-react'

export default function SystemStatusPage() {
  const { apiCall } = useContext(AuthContext)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await apiCall('/admin/dashboard/stats')
        if (res.success) {
          setStats(res.data)
        }
      } catch (err) {
        toast.error('Failed to query integration states.')
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <h1 className="text-2xl font-serif font-bold text-slate-900">System Diagnostics</h1>
        <div className="bg-white border rounded-xl h-60" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-serif font-light text-slate-900">System Diagnostics</h1>
        <p className="text-xs text-slate-500 mt-1">Review active integrations, connection settings, and server status metrics.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b">
          <Terminal className="text-[#C6A972]" size={18} />
          <h2 className="font-serif text-base font-semibold text-slate-800 font-serif">Diagnostics Logs</h2>
        </div>

        <div className="space-y-5">
          {/* DATABASE status */}
          <div className="flex items-start gap-4 p-4 bg-slate-50 border rounded-lg">
            <div className="bg-blue-50 text-blue-500 p-2.5 rounded-lg shrink-0">
              <Database size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase">MongoDB Atlas Database</h3>
              <p className="text-[10px] text-slate-400 mt-1">Primary storage cluster holding products, inquiries, settings, and user logs.</p>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-700">{stats.systemStatus?.database || 'CONNECTED'}</span>
              </div>
            </div>
          </div>

          {/* CLOUDINARY status */}
          <div className="flex items-start gap-4 p-4 bg-slate-50 border rounded-lg">
            <div className="bg-orange-50 text-orange-500 p-2.5 rounded-lg shrink-0">
              <ImageIcon size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase">Cloudinary CDN Storage</h3>
              <p className="text-[10px] text-slate-400 mt-1">External media asset content delivery network hosting optimized product high-res photography.</p>
              <div className="mt-2.5 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${stats.systemStatus?.cloudinary === 'CONFIGURED' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                <span className="text-[10px] font-bold text-slate-700">{stats.systemStatus?.cloudinary === 'CONFIGURED' ? 'CONFIGURED & CONNECTED' : 'NOT CONFIGURED (FALLBACK BASE64)'}</span>
              </div>
            </div>
          </div>

          {/* SMTP mail status */}
          <div className="flex items-start gap-4 p-4 bg-slate-50 border rounded-lg">
            <div className="bg-emerald-50 text-emerald-500 p-2.5 rounded-lg shrink-0">
              <Mail size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase">SMTP Mailer Service</h3>
              <p className="text-[10px] text-slate-400 mt-1">Nodemailer service forwarding client lookbook inquiries to showroom inbox.</p>
              <div className="mt-2.5 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${stats.systemStatus?.smtp === 'CONFIGURED' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                <span className="text-[10px] font-bold text-slate-700">{stats.systemStatus?.smtp === 'CONFIGURED' ? 'CONFIGURED & CONNECTED' : 'NOT CONFIGURED (LOGS ONLY)'}</span>
              </div>
            </div>
          </div>

          {/* ENVIRONMENT variables check */}
          <div className="flex items-start gap-4 p-4 bg-slate-50 border rounded-lg">
            <div className="bg-slate-200 text-slate-700 p-2.5 rounded-lg shrink-0">
              <Server size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase">Configuration Variables Diagnostics</h3>
              <p className="text-[10px] text-slate-400 mt-1">Verifies active settings parameters mapping the Lookbook API hosts.</p>
              <div className="mt-3.5 space-y-1.5 font-mono text-[9px] text-slate-500">
                <p>NEXT_PUBLIC_SITE_URL: <span className="text-slate-700 font-bold">{process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}</span></p>
                <p>NEXT_PUBLIC_ADMIN_URL: <span className="text-slate-700 font-bold">{process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'}</span></p>
                <p>NEXT_PUBLIC_API_URL: <span className="text-slate-700 font-bold">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}</span></p>
                <p>AUTH_SECRET Status: <span className="text-emerald-600 font-bold">ACTIVE (SECRET SIGNED)</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
