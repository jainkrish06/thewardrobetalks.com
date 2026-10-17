'use client'

import { useEffect, useState, createContext, useContext } from 'react'
import { Toaster, toast } from 'sonner'
import {
  LayoutDashboard,
  Shirt,
  Image as ImageIcon,
  Sliders,
  HelpCircle,
  BookOpen,
  Settings as SettingsIcon,
  Users,
  Terminal,
  LogOut,
  Menu,
  X,
  Lock
} from 'lucide-react'
import './globals.css'

export const AuthContext = createContext({
  token: null,
  user: null,
  logout: () => {},
  apiCall: async () => {}
})

export default function RootLayout({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  const getApiUrl = () => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return 'https://wardrobe-talks-couture.netlify.app'
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
  }
  const apiUrl = getApiUrl()

  const getSiteUrl = () => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return 'https://wardrobe-talks-couture.netlify.app'
    }
    return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  }

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('wt_admin_token')
      const savedUser = localStorage.getItem('wt_admin_user')
      if (savedToken && savedUser) {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      }
    } catch (err) {
      console.error('Failed to parse admin session:', err)
      localStorage.removeItem('wt_admin_token')
      localStorage.removeItem('wt_admin_user')
    } finally {
      setIsLoaded(true)
    }
  }, [])

  const logout = () => {
    localStorage.removeItem('wt_admin_token')
    localStorage.removeItem('wt_admin_user')
    document.cookie = 'wt_session=; Max-Age=0; path=/;'
    setToken(null)
    setUser(null)
    toast.success('Signed out successfully.')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })
      const data = await res.json()
      if (data.success) {
        const u = { name: data.data.name, role: data.data.role, email: loginForm.email }
        localStorage.setItem('wt_admin_token', data.data.token)
        localStorage.setItem('wt_admin_user', JSON.stringify(u))
        // Set session cookie for matching port API requests
        document.cookie = `wt_session=${data.data.token}; max-age=604800; path=/; sameSite=Lax`
        setToken(data.data.token)
        setUser(u)
        toast.success(`Welcome back, ${u.name}!`)
      } else {
        setLoginError(data.error?.message || 'Invalid email or password.')
      }
    } catch (err) {
      setLoginError('Unable to connect to the backend server API.')
    } finally {
      setLoginLoading(false)
    }
  }

  const apiCall = async (endpoint, options = {}) => {
    const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('wt_admin_token') : null)
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`
    }
    const res = await fetch(`${apiUrl}/api${endpoint}`, {
      ...options,
      headers
    })
    const data = await res.json()
    if (!res.ok && (res.status === 401 || res.status === 403)) {
      logout()
      throw new Error('Session expired or unauthorized.')
    }
    return data
  }

  if (!isLoaded) {
    return (
      <html lang="en">
        <body className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
          <div className="animate-pulse text-slate-400 font-serif italic">Loading Dashboard…</div>
        </body>
      </html>
    )
  }

  // LOGIN SCREEN
  if (!token) {
    return (
      <html lang="en">
        <body className="min-h-screen bg-slate-900 flex items-center justify-center px-4 font-sans text-slate-100">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700/60 p-8 shadow-2xl rounded-lg">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-[#C6A972]/15 p-2 rounded-lg text-[#C6A972]">
                <Lock size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#C6A972] font-semibold">Wardrobe Talks</p>
                <h1 className="text-xl font-bold font-serif text-white">Admin Dashboard</h1>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-6">Access is limited to authorized administrators only. Please log in using your registered credentials.</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-300 mb-1.5">Email Address</label>
                <input
                  required
                  type="email"
                  placeholder="name@wardrobetalks.com"
                  value={loginForm.email}
                  onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C6A972]/80 transition"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-300 mb-1.5">Password</label>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-[#C6A972]/80 transition"
                />
              </div>

              {loginError && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/40 px-3.5 py-2.5 rounded-lg leading-relaxed">{loginError}</p>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-[#C6A972] hover:bg-[#d8b87e] disabled:opacity-60 text-slate-950 py-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition"
              >
                {loginLoading ? 'Signing In…' : 'Sign In'}
              </button>
            </form>
          </div>
          <Toaster position="top-right" richColors />
        </body>
      </html>
    )
  }

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Products & collections', icon: Shirt, path: '/products' },
    { label: 'Hero Slides', icon: Sliders, path: '/hero' },
    { label: 'Daily Atelier', icon: ImageIcon, path: '/gallery' },
    { label: 'Inquiries', icon: HelpCircle, path: '/inquiries' },
    { label: 'Blogs & Editorial', icon: BookOpen, path: '/blogs' },
    { label: 'Website Settings', icon: SettingsIcon, path: '/settings' },
    { label: 'Admin Users', icon: Users, path: '/users', superAdminOnly: true },
    { label: 'System status', icon: Terminal, path: '/system' }
  ]

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'
  const allowedNavItems = navItems.filter(item => !item.superAdminOnly || isSuperAdmin)

  const isSelected = (path) => {
    if (typeof window === 'undefined') return false
    const pathname = window.location.pathname
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  const roleLabels = {
    SUPER_ADMIN: 'Super Admin',
    CONTENT_MANAGER: 'Content Manager',
    INQUIRY_MANAGER: 'Inquiry Manager'
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
        <AuthContext.Provider value={{ token, user, logout, apiCall }}>
          {/* DESKTOP SIDEBAR */}
          <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 shrink-0">
            <div className="flex items-center gap-2.5 h-16 px-6 border-b border-slate-800 shrink-0">
              <Shirt className="text-[#C6A972]" size={20} />
              <span className="font-serif text-lg text-white">Wardrobe <span className="text-[#C6A972] italic text-sm">Dashboard</span></span>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
              {allowedNavItems.map(item => {
                const active = isSelected(item.path)
                return (
                  <a
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                      active
                        ? 'bg-[#C6A972]/15 text-[#C6A972]'
                        : 'hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </a>
                )
              })}
            </nav>
            <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs flex flex-col gap-2 shrink-0">
              <div>
                <p className="font-semibold text-white leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-400 mt-1">{roleLabels[user.role] || user.role}</p>
              </div>
              <button
                onClick={logout}
                className="mt-2 flex items-center gap-2 text-[#C6A972] hover:text-[#d8b87e] transition font-semibold"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          </aside>

          {/* MOBILE DRAWER DRAWER */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/60 backdrop-blur-sm">
              <div className="relative flex flex-col w-64 bg-slate-900 text-slate-300 animate-slide-in">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-2.5 h-16 px-6 border-b border-slate-800 shrink-0">
                  <Shirt className="text-[#C6A972]" size={20} />
                  <span className="font-serif text-lg text-white">Wardrobe <span className="text-[#C6A972] italic text-sm">Dashboard</span></span>
                </div>
                <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
                  {allowedNavItems.map(item => {
                    const active = isSelected(item.path)
                    return (
                      <a
                        key={item.path}
                        href={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                          active
                            ? 'bg-[#C6A972]/15 text-[#C6A972]'
                            : 'hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                      </a>
                    )
                  })}
                </nav>
                <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs flex flex-col gap-2 shrink-0">
                  <div>
                    <p className="font-semibold text-white">{user.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{roleLabels[user.role] || user.role}</p>
                  </div>
                  <button
                    onClick={() => { setMobileMenuOpen(false); logout(); }}
                    className="mt-2 flex items-center gap-2 text-[#C6A972] hover:text-[#d8b87e] font-semibold"
                  >
                    <LogOut size={14} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MAIN PAGE AREA */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* TOP HEADER */}
            <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-10">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 border border-slate-200 rounded-lg lg:hidden"
                  aria-label="Toggle menu"
                >
                  <Menu size={20} />
                </button>
                <div className="text-xs text-slate-400 tracking-wider uppercase font-semibold">
                  Wardrobe Talks Atelier Admin
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={getSiteUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition"
                >
                  View Lookbook Website
                </a>
              </div>
            </header>

            {/* PAGE BODY CONTENT */}
            <main className="flex-1 overflow-y-auto p-6 md:p-8">
              {children}
            </main>
          </div>
          <Toaster position="top-right" richColors />
        </AuthContext.Provider>
      </body>
    </html>
  )
}
