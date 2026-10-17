'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Instagram, Facebook, Youtube, Mail, Phone, MapPin, MessageCircle, ChevronRight, ChevronLeft } from 'lucide-react'

/* ------------------------------ Constants ------------------------------ */
const NAV = [
  { key: 'home', label: 'Home' },
  { key: 'women', label: 'Women' },
  { key: 'men', label: 'Men' },
  { key: 'celebrity', label: 'Celebrity' },
  { key: 'about', label: 'About' },
  { key: 'contact', label: 'Contact' },
]

const WOMEN_SUBCATS = ['Bridal Edit', 'Bridal Blouse', 'Bridal Lehenga', 'Casual Lehenga', 'Anarkali', 'Silk Palazzo', 'Co-ords', 'Ethnic Wear', 'Sharara & Kurta']

const HERO_IMG = 'https://images.unsplash.com/photo-1629118477133-b8b1499f2b8a?w=1920&q=85'
const ABOUT_DESIGNER = 'https://images.unsplash.com/photo-1613909671501-f9678ffc1d33?w=900&q=85'
const ABOUT_WORKSHOP_1 = 'https://images.pexels.com/photos/9850415/pexels-photo-9850415.jpeg?w=900'
const ABOUT_WORKSHOP_2 = 'https://images.pexels.com/photos/7763068/pexels-photo-7763068.jpeg?w=900'

/* ------------------------------ Toast ------------------------------ */
let toastFn = null
const showToast = (msg, type = 'success') => { if (toastFn) toastFn({ msg, type }) }

const ToastHost = () => {
  const [toast, setToast] = useState(null)
  useEffect(() => {
    toastFn = (t) => {
      setToast(t)
      setTimeout(() => setToast(null), 3000)
    }
    return () => { toastFn = null }
  }, [])
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-6 right-6 z-[100] px-5 py-3 text-sm shadow-2xl border ${
            toast.type === 'error'
              ? 'bg-[#1C1C1C] text-red-300 border-red-400/40'
              : 'bg-[#1C1C1C] text-[#C6A972] border-[#C6A972]/40'
          }`}
        >
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------ Helpers ------------------------------ */
const normalizeUrl = (url) => {
  if (!url) return ''
  const t = url.trim()
  if (!t) return ''
  if (t.startsWith('http://') || t.startsWith('https://') || t.startsWith('mailto:')) return t
  if (t.startsWith('//')) return 'https:' + t
  return 'https://' + t
}

/* ------------------------------ API ------------------------------ */
const api = {
  get: (p) => fetch(`/api${p}`).then(r => r.json()).then(res => res && res.data !== undefined ? res.data : res),
  post: (p, b, t) => fetch(`/api${p}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: JSON.stringify(b) }).then(r => r.json()),
  put: (p, b, t) => fetch(`/api${p}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify(b) }).then(r => r.json()),
  del: (p, t) => fetch(`/api${p}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()),
}

/* ------------------------------ Header ------------------------------ */
const Header = ({ view, navigate }) => {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  // Lock body scroll when menu is open
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])
  // Close mobile menu when navigating
  useEffect(() => { setOpen(false) }, [view])
  return (
    <header className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${scrolled || view !== 'home' ? 'bg-[#121212]/95 backdrop-blur-md border-b border-[#D8C4A0]/20' : 'bg-transparent'}`}>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex items-center justify-between h-20">
        <button onClick={() => navigate('home')} className="flex items-baseline gap-2">
          <span className={`font-serif text-2xl tracking-wide ${scrolled || view !== 'home' ? 'text-[#F5F1E8]' : 'text-white'}`}>Wardrobe</span>
          <span className={`font-serif italic text-lg ${scrolled || view !== 'home' ? 'text-[#C6A972]' : 'text-[#D8C4A0]'}`}>Talks</span>
        </button>
        <nav className="hidden lg:flex gap-9">
          {NAV.map(n => (
            <button
              key={n.key}
              onClick={() => navigate(n.key)}
              className={`text-xs uppercase tracking-luxury gold-underline transition ${
                (view === n.key || (view === 'collection' && n.key === 'women'))
                  ? (scrolled || view !== 'home' ? 'text-[#C6A972]' : 'text-[#D8C4A0]')
                  : (scrolled || view !== 'home' ? 'text-[#F5F1E8]' : 'text-white')
              }`}
            >{n.label}</button>
          ))}
        </nav>
        <button onClick={() => setOpen(true)} className="lg:hidden p-2 border border-[#C6A972]/60 text-[#C6A972] hover:bg-[#C6A972] hover:text-[#121212] transition" aria-label="Open menu"><Menu size={20} /></button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 bg-[#0a0a0a] z-[60] lg:hidden flex flex-col"
          >
            <div className="flex justify-between items-center h-20 px-6 border-b border-[#C6A972]/20">
              <span className="font-serif text-2xl text-[#F5F1E8]">Wardrobe <span className="text-[#C6A972] italic text-lg">Talks</span></span>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-2 border border-[#C6A972]/40 text-[#C6A972] hover:bg-[#C6A972] hover:text-[#121212] transition"><X size={20} /></button>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="flex-1 flex flex-col items-center justify-center gap-8 px-6"
            >
              {NAV.map(n => (
                <button key={n.key} onClick={() => { navigate(n.key); setOpen(false) }} className="font-serif text-3xl text-[#F5F1E8] hover:text-[#C6A972] transition">{n.label}</button>
              ))}
            </motion.div>
            <div className="border-t border-[#C6A972]/20 py-6 text-center">
              <p className="uppercase tracking-luxury text-[10px] text-[#D8C4A0]">Wardrobe Talks</p>
              <p className="text-xs text-[#A8A8A8] mt-1 font-serif italic">Where threads tell stories.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

/* ------------------------------ Hero Slider ------------------------------ */
const HeroSlider = ({ slides, navigate }) => {
  const [idx, setIdx] = useState(0)
  const list = slides && slides.length > 0 ? slides : [{
    image: HERO_IMG, kicker: 'Wardrobe Talks', title: 'Couture, Quietly Spoken.', subtitle: 'A Mumbai atelier crafting heirloom Indian wear since 2014.', ctaLabel: 'Explore', ctaTarget: 'women'
  }]
  const len = list.length

  useEffect(() => {
    if (len <= 1) return
    const t = setInterval(() => setIdx(i => (i + 1) % len), 6000)
    return () => clearInterval(t)
  }, [len])

  const go = (n) => setIdx((n + len) % len)
  const current = list[idx]

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id || idx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img src={current.image} alt={current.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/75" />
        </motion.div>
      </AnimatePresence>

      <div className="relative h-full flex flex-col items-center justify-center text-center text-white px-6 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={(current.id || idx) + '-text'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="max-w-5xl"
          >
            {current.kicker && <p className="uppercase tracking-luxury text-xs text-[#C6A972] mb-5">{current.kicker}</p>}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-light leading-[1.05]">{current.title}</h1>
            {current.subtitle && <p className="mt-6 font-serif italic text-base md:text-lg text-white/85 max-w-xl mx-auto">{current.subtitle}</p>}
            {current.ctaLabel && (
              <div className="mt-9">
                <button onClick={() => navigate(current.ctaTarget || 'women')} className="px-8 py-3.5 bg-[#C6A972] text-[#121212] text-xs uppercase tracking-luxury hover:bg-[#D8C4A0] transition">
                  {current.ctaLabel}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {len > 1 && (
        <>
          <button onClick={() => go(idx - 1)} aria-label="Previous slide"
                  className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border border-white/40 text-white hover:bg-[#C6A972] hover:text-[#121212] hover:border-[#C6A972] transition">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => go(idx + 1)} aria-label="Next slide"
                  className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border border-white/40 text-white hover:bg-[#C6A972] hover:text-[#121212] hover:border-[#C6A972] transition">
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {list.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} aria-label={`Go to slide ${i + 1}`}
                      className={`h-[2px] transition-all ${i === idx ? 'w-10 bg-[#C6A972]' : 'w-6 bg-white/40 hover:bg-white/70'}`} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

/* ------------------------------ Product Card ------------------------------ */
const ProductCard = ({ p, navigate, index = 0 }) => (
  <motion.button
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-30px' }}
    transition={{ duration: 0.7, delay: (index % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
    onClick={() => navigate('product', { id: p.id })}
    className="text-left group block w-full"
  >
    <div className="zoom-img relative aspect-[3/4] bg-[#1C1C1C] overflow-hidden">
      <img src={p.images?.[0]} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
      {p.featured && <span className="absolute top-3 left-3 bg-[#C6A972] text-[#121212] text-[9px] uppercase tracking-luxury px-2 py-1">Signature</span>}
    </div>
    <div className="pt-4 px-1">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: (index % 4) * 0.08 + 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="text-[10px] uppercase tracking-luxury text-[#C6A972]"
      >
        {p.subcategory}
      </motion.p>
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: (index % 4) * 0.08 + 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="font-serif text-lg mt-1.5 group-hover:text-[#C6A972] transition"
      >
        {p.title}
      </motion.h3>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: (index % 4) * 0.08 + 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="text-xs text-[#A8A8A8] italic mt-1 line-clamp-1"
      >
        {p.fabric}
      </motion.p>
    </div>
  </motion.button>
)

/* ------------------------------ Section Title ------------------------------ */
const SectionTitle = ({ kicker, title, sub }) => (
  <motion.div
    initial={{ opacity: 0, y: 35 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    className="text-center mb-14"
  >
    {kicker && (
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="uppercase tracking-luxury text-[10px] text-[#D8C4A0] mb-3"
      >
        {kicker}
      </motion.p>
    )}
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="font-serif text-4xl md:text-5xl font-light text-[#F5F1E8]"
    >
      {title}
    </motion.h2>
    {sub && (
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="mt-3 font-serif italic text-[#A8A8A8] max-w-xl mx-auto"
      >
        {sub}
      </motion.p>
    )}
  </motion.div>
)

/* ------------------------------ Daily Atelier Reels ------------------------------ */
const DailyAtelierReels = ({ gallery, settings }) => {
  const [startIndex, setStartIndex] = useState(0)
  const list = gallery && gallery.length > 0 ? gallery : []
  const total = list.length
  const maxVisibleDesktop = 3
  const canPrev = startIndex > 0
  const canNext = startIndex + maxVisibleDesktop < total

  const goNext = () => {
    if (canNext) setStartIndex(prev => prev + 1)
  }

  const goPrev = () => {
    if (canPrev) setStartIndex(prev => prev - 1)
  }

  return (
    <section className="py-24 md:py-32 px-6 max-w-[1400px] mx-auto">
      <SectionTitle kicker="@wardrobe.talks" title="The Daily Atelier" sub="A peek into the workshop." />

      {/* DESKTOP LAYOUT (3 Large 9:16 Vertical Reel Cards) */}
      <div className="hidden md:block max-w-[1280px] mx-auto">
        <div className="grid grid-cols-3 gap-8 lg:gap-12">
          {list.slice(startIndex, startIndex + maxVisibleDesktop).map((g, i) => (
            <motion.a
              key={g.id || (startIndex + i)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              href={normalizeUrl(g.link) || normalizeUrl(settings?.instagramUrl) || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative aspect-[9/16] w-full rounded-sm overflow-hidden group border border-white/10 hover:border-[#C6A972]/40 shadow-2xl transition-all duration-500"
            >
              <img
                src={g.image}
                alt="The Daily Atelier"
                loading="lazy"
                className="w-full h-full object-cover transform scale-100 group-hover:scale-[1.04] transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent group-hover:bg-black/35 transition-colors duration-500 flex items-center justify-center">
                {/* Subtle Minimal Instagram Reel Indicator */}
                <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 group-hover:scale-110 group-hover:border-[#C6A972] group-hover:text-[#C6A972] transition-all duration-500 shadow-lg">
                  <Instagram size={20} />
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Carousel Controls on Desktop if total > 3 */}
        {total > maxVisibleDesktop && (
          <div className="flex items-center justify-center gap-4 mt-12">
            <button
              onClick={goPrev}
              disabled={!canPrev}
              aria-label="Previous Reels"
              className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-300 ${
                canPrev
                  ? 'border-[#C6A972]/40 text-[#C6A972] hover:bg-[#C6A972] hover:text-[#121212]'
                  : 'border-white/10 text-white/20 cursor-not-allowed'
              }`}
            >
              <ChevronLeft size={18} />
            </button>

            <span className="text-xs uppercase tracking-luxury text-[#A8A8A8]">
              {startIndex + 1} – {Math.min(startIndex + maxVisibleDesktop, total)} / {total}
            </span>

            <button
              onClick={goNext}
              disabled={!canNext}
              aria-label="Next Reels"
              className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-300 ${
                canNext
                  ? 'border-[#C6A972]/40 text-[#C6A972] hover:bg-[#C6A972] hover:text-[#121212]'
                  : 'border-white/10 text-white/20 cursor-not-allowed'
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* MOBILE LAYOUT (Swipeable Carousel with 1 large vertical reel + peek of next) */}
      <div className="md:hidden flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 -mx-6 px-6">
        {list.map((g, i) => (
          <a
            key={g.id || i}
            href={normalizeUrl(g.link) || normalizeUrl(settings?.instagramUrl) || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="snap-center shrink-0 w-[82vw] max-w-[320px] aspect-[9/16] relative rounded-sm overflow-hidden group border border-white/10 active:scale-[0.98] transition-transform duration-300"
          >
            <img
              src={g.image}
              alt="The Daily Atelier"
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-center justify-center">
              <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90">
                <Instagram size={18} />
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------ Home ------------------------------ */
const HomeView = ({ navigate, products, gallery, settings, hero }) => {
  const featured = products.filter(p => p.featured)
  const latest = [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8)
  const bridal = products.filter(p => p.subcategory?.toLowerCase().includes('bridal'))
  const celeb = products.filter(p => p.category === 'Celebrity')

  return (
    <div>
      <HeroSlider slides={hero} navigate={navigate} />

      {/* Featured Collections */}
      <section className="py-24 px-6 max-w-[1400px] mx-auto">
        <SectionTitle kicker="The Signature Edit" title="Featured Collections" sub="A curated set of pieces close to the house's heart this season." />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
          {featured.slice(0, 8).map((p, i) => <ProductCard key={p.id} p={p} index={i} navigate={navigate} />)}
        </div>
      </section>

      {/* Bridal */}
      <section className="py-24 px-6 bg-[#1C1C1C]">
        <div className="max-w-[1400px] mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="zoom-img aspect-[4/5]">
            <img src="https://images.unsplash.com/photo-1610047614301-13c63f00c032?w=900" alt="Bridal collection" className="w-full h-full object-cover" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="uppercase tracking-luxury text-[10px] text-[#D8C4A0] mb-3"
            >
              The Bridal Edit
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-4xl md:text-5xl font-light leading-tight text-[#F5F1E8]"
            >
              For the bride who wears<br/><em className="text-[#C6A972]">a story.</em>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 text-[#A8A8A8] leading-relaxed max-w-md"
            >
              Every bridal piece is hand-embroidered in our atelier over months. Zardozi, gota, dabka — heirloom techniques shaped for the modern woman.
            </motion.p>
            <button onClick={() => navigate('collection', { sub: 'Bridal Lehenga' })} className="mt-8 inline-flex items-center gap-2 text-xs uppercase tracking-luxury text-[#C6A972] hover:gap-4 transition-all">View The Bridal Edit <ChevronRight size={14} /></button>
            <div className="mt-10 grid grid-cols-3 gap-3">
              {bridal.slice(0, 3).map(p => (
                <button key={p.id} onClick={() => navigate('product', { id: p.id })} className="zoom-img aspect-square">
                  <img src={p.images?.[0]} alt={p.title} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Latest */}
      <section className="py-24 px-6 max-w-[1400px] mx-auto">
        <SectionTitle kicker="New In" title="Latest Arrivals" sub="Just off our karigars' tables." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
          {latest.map((p, i) => <ProductCard key={p.id} p={p} index={i} navigate={navigate} />)}
        </div>
      </section>

      {/* Celebrity */}
      <section className="py-24 px-6 bg-[#1C1C1C] text-white">
        <div className="max-w-[1400px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-14"
          >
            <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="uppercase tracking-luxury text-[10px] text-[#D8C4A0] mb-3">As Seen On</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className="font-serif text-4xl md:text-5xl font-light">The Celebrity Edit</motion.h2>
            <motion.p initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} className="mt-3 font-serif italic text-white/60 max-w-xl mx-auto">Worn on the red carpet, on the silver screen, and into the spotlight.</motion.p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-8">
            {celeb.slice(0, 2).map((p, i) => (
              <button key={p.id} onClick={() => navigate('product', { id: p.id })} className="zoom-img relative aspect-[4/5] group text-left">
                <img src={p.images?.[0]} alt={p.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="absolute bottom-0 left-0 right-0 p-8"
                >
                  <p className="text-[10px] uppercase tracking-luxury text-[#D8C4A0]">{p.subcategory}</p>
                  <h3 className="font-serif text-3xl mt-2">{p.title}</h3>
                </motion.div>
              </button>
            ))}
          </div>
          <div className="text-center mt-12">
            <button onClick={() => navigate('celebrity')} className="text-xs uppercase tracking-luxury text-[#D8C4A0] hover:text-white transition">View Celebrity Archive →</button>
          </div>
        </div>
      </section>

      {/* Instagram / Daily Atelier */}
      <DailyAtelierReels gallery={gallery} settings={settings} />
    </div>
  )
}

/* ------------------------------ Collection ------------------------------ */
const CollectionView = ({ navigate, products, category, initialSub }) => {
  const [sub, setSub] = useState(initialSub || 'All')
  const items = useMemo(() => {
    let list = products.filter(p => p.category === category)
    if (sub !== 'All') list = list.filter(p => p.subcategory === sub)
    return list
  }, [products, category, sub])
  const subs = category === 'Women' ? ['All', ...WOMEN_SUBCATS] : ['All', ...Array.from(new Set(products.filter(p => p.category === category).map(p => p.subcategory)))]
  return (
    <div className="pt-32 pb-24 px-6 max-w-[1400px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-12"
      >
        <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="uppercase tracking-luxury text-[10px] text-[#D8C4A0] mb-3">The Collection</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className="font-serif text-5xl md:text-6xl font-light text-[#F5F1E8]">{category}</motion.h1>
      </motion.div>
      <div className="flex flex-wrap justify-center gap-2 mb-14 no-scrollbar">
        {subs.map(s => (
          <button key={s} onClick={() => setSub(s)} className={`px-5 py-2 text-[11px] uppercase tracking-luxury transition border ${sub === s ? 'bg-[#C6A972] text-[#121212] border-[#C6A972]' : 'text-[#F5F1E8] border-[#C6A972]/25 hover:border-[#C6A972] hover:text-[#C6A972]'}`}>{s}</button>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="text-center font-serif italic text-[#A8A8A8] py-20">New pieces coming soon to this edit.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
          {items.map((p, i) => <ProductCard key={p.id} p={p} index={i} navigate={navigate} />)}
        </div>
      )}
    </div>
  )
}

/* ------------------------------ Product Detail ------------------------------ */
const ProductView = ({ navigate, productId, settings }) => {
  const [product, setProduct] = useState(null)
  const [idx, setIdx] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  useEffect(() => {
    setIdx(0); setProduct(null)
    api.get(`/products/${productId}`).then(setProduct)
  }, [productId])

  useEffect(() => {
    if (product) setForm(f => ({ ...f, message: `Hello, I am interested in "${product.title}". Could you share more details?` }))
  }, [product])

  if (!product) return <div className="pt-32 px-6 text-center font-serif italic text-[#A8A8A8]/60">Loading the piece…</div>
  if (product.error) return <div className="pt-32 px-6 text-center">Not found.</div>

  const waNumber = (settings?.whatsappNumber || '+919885525611').replace(/[^0-9]/g, '')
  const waMessage = encodeURIComponent(`Hello Wardrobe Talks, I'd love to know more about "${product.title}" (${product.subcategory}).`)
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`

  const submitInquiry = async (e) => {
    e.preventDefault()
    await api.post('/inquiries', { ...form, productId: product.id, productTitle: product.title })
    setSent(true)
    setTimeout(() => { setShowForm(false); setSent(false) }, 2500)
  }

  return (
    <div className="pt-28 pb-24 px-6 max-w-[1400px] mx-auto">
      <button onClick={() => navigate('women')} className="text-xs uppercase tracking-luxury text-[#A8A8A8] hover:text-[#C6A972] mb-8">← Back to Collection</button>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <div>
          <div className="relative aspect-[4/5] bg-[#1C1C1C] overflow-hidden">
            <img src={product.images?.[idx] || 'https://placehold.co/600x800?text=No+Image'} alt={product.title} className="w-full h-full object-cover" />
            {product.images && product.images.length > 1 && (
              <>
                <button onClick={() => setIdx((idx - 1 + product.images.length) % product.images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-[#1C1C1C]/80 hover:bg-[#1C1C1C] p-2"><ChevronLeft size={18} /></button>
                <button onClick={() => setIdx((idx + 1) % product.images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#1C1C1C]/80 hover:bg-[#1C1C1C] p-2"><ChevronRight size={18} /></button>
              </>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {product.images.map((src, i) => (
                <button key={i} onClick={() => setIdx(i)} className={`aspect-square border-2 ${idx === i ? 'border-[#C6A972]' : 'border-transparent'}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="lg:pl-8 lg:sticky lg:top-28 self-start">
          <p className="uppercase tracking-luxury text-[10px] text-[#D8C4A0]">{product.category} · {product.subcategory}</p>
          <h1 className="font-serif text-4xl md:text-5xl font-light mt-3">{product.title}</h1>
          <p className="mt-6 text-[#D8C4A0] leading-relaxed">{product.description}</p>

          <div className="mt-8 space-y-3 border-t border-b border-[#C6A972]/20 py-6">
            <Detail k="Fabric" v={product.fabric} />
            <Detail k="Occasion" v={product.occasion} />
            <Detail k="Designer's Note" v={product.designerNotes} italic />
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white py-4 text-xs uppercase tracking-luxury transition">
              <MessageCircle size={16} /> Enquire via WhatsApp
            </a>
            <button onClick={() => setShowForm(true)} className="flex-1 flex items-center justify-center gap-2 bg-[#C6A972] hover:bg-[#D8C4A0] text-[#121212] py-4 text-xs uppercase tracking-luxury transition">
              <Mail size={16} /> Email Enquiry
            </button>
          </div>

          <p className="mt-5 font-serif italic text-sm text-[#A8A8A8]">All pieces are made to order. Standard delivery 6–10 weeks.</p>
        </div>
      </div>

      {/* Related */}
      {product.related?.length > 0 && (
        <div className="mt-24">
          <SectionTitle title="You May Also Love" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
            {product.related.map(p => <ProductCard key={p.id} p={p} navigate={navigate} />)}
          </div>
        </div>
      )}

      {/* Inquiry Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="bg-[#121212] max-w-md w-full p-8 relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowForm(false)} className="absolute top-4 right-4"><X size={20} /></button>
              {sent ? (
                <div className="text-center py-8">
                  <p className="font-serif text-3xl text-[#C6A972]">Thank you.</p>
                  <p className="mt-3 text-sm text-[#A8A8A8] font-serif italic">We will reach out within 24 hours.</p>
                </div>
              ) : (
                <>
                  <p className="uppercase tracking-luxury text-[10px] text-[#D8C4A0]">Private Enquiry</p>
                  <h3 className="font-serif text-2xl mt-2">{product.title}</h3>
                  <form onSubmit={submitInquiry} className="mt-6 space-y-3">
                    <input required placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 bg-[#1C1C1C] border border-[#C6A972]/20 focus:border-[#C6A972] outline-none text-sm" />
                    <input required placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 bg-[#1C1C1C] border border-[#C6A972]/20 focus:border-[#C6A972] outline-none text-sm" />
                    <input placeholder="Phone (optional)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 bg-[#1C1C1C] border border-[#C6A972]/20 focus:border-[#C6A972] outline-none text-sm" />
                    <textarea required rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="w-full px-4 py-3 bg-[#1C1C1C] border border-[#C6A972]/20 focus:border-[#C6A972] outline-none text-sm" />
                    <button type="submit" className="w-full bg-[#C6A972] hover:bg-[#D8C4A0] text-[#121212] py-3.5 text-xs uppercase tracking-luxury transition">Send Enquiry</button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const Detail = ({ k, v, italic }) => (
  <div className="flex gap-6">
    <span className="uppercase tracking-luxury text-[10px] text-[#A8A8A8] w-32 shrink-0 pt-1">{k}</span>
    <span className={`text-sm text-[#F5F1E8] ${italic ? 'font-serif italic' : ''}`}>{v}</span>
  </div>
)

/* ------------------------------ Social Icons ------------------------------ */
const SocialIcons = ({ settings, size = 18, className = '' }) => {
  const links = [
    { Icon: Instagram, href: normalizeUrl(settings?.instagramUrl), label: 'Instagram' },
    { Icon: Facebook, href: normalizeUrl(settings?.facebookUrl), label: 'Facebook' },
    { Icon: Youtube, href: normalizeUrl(settings?.youtubeUrl), label: 'YouTube' },
    { Icon: Mail, href: settings?.inquiryEmail ? `mailto:${settings.inquiryEmail}` : '', label: 'Email' },
  ]
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {links.map(({ Icon, href, label }) => (
        <a key={label} href={href || '#'} target={href ? '_blank' : undefined} rel="noopener noreferrer" aria-label={label}
           className="w-10 h-10 inline-flex items-center justify-center border border-[#C6A972]/40 text-[#C6A972] hover:bg-[#C6A972] hover:text-[#121212] transition">
          <Icon size={size} />
        </a>
      ))}
    </div>
  )
}

/* ------------------------------ About ------------------------------ */
const AboutView = ({ settings }) => (
  <div className="pt-32 pb-24">
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-3xl mx-auto px-6 text-center mb-20"
    >
      <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="uppercase tracking-luxury text-[10px] text-[#D8C4A0] mb-4">The House</motion.p>
      <motion.h1 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className="font-serif text-4xl md:text-6xl font-light">A Quiet Devotion<br/>to Craft.</motion.h1>
      <motion.p initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} className="mt-8 font-serif italic text-base md:text-lg text-[#A8A8A8] leading-relaxed">Founded in 2014 in a small studio. A single vision — to bring back the slow poetry of Indian couture.</motion.p>
    </motion.section>

    <section className="max-w-[1200px] mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center mb-24">
      <div className="zoom-img aspect-[4/5]"><img src={ABOUT_DESIGNER} alt="Designer" className="w-full h-full object-cover" /></div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="uppercase tracking-luxury text-[10px] text-[#D8C4A0] mb-3">Meet the Designer</p>
        <h2 className="font-serif text-4xl font-light">Aanya Kapoor</h2>
        <p className="mt-6 text-[#D8C4A0] leading-relaxed">NIFT alumna. Trained under master karigars in Lucknow and Banaras. Dressed brides across four continents and the red carpet at Cannes.</p>
        <p className="mt-4 font-serif italic text-[#F5F1E8] leading-relaxed">&ldquo;Couture should feel like an heirloom from the moment you wear it.&rdquo;</p>
      </motion.div>
    </section>

    <section className="bg-[#1C1C1C] py-20 px-6">
      <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-12">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="uppercase tracking-luxury text-[10px] text-[#D8C4A0] mb-3">Our Vision</p>
          <h3 className="font-serif text-2xl md:text-3xl font-light">Heirloom luxury, accessible to a new generation.</h3>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="uppercase tracking-luxury text-[10px] text-[#D8C4A0] mb-3">Our Mission</p>
          <p className="font-serif text-lg md:text-xl italic leading-relaxed text-[#D8C4A0]">To protect the karigars who carry centuries of textile knowledge — and translate their craft into pieces future generations will inherit.</p>
        </motion.div>
      </div>
    </section>

    <section className="max-w-[1200px] mx-auto px-6 py-20">
      <SectionTitle kicker="Inside the Atelier" title="The Workshop" />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="zoom-img aspect-[4/3]"><img src={ABOUT_WORKSHOP_1} alt="Workshop" className="w-full h-full object-cover" /></div>
        <div className="zoom-img aspect-[4/3]"><img src={ABOUT_WORKSHOP_2} alt="Workshop" className="w-full h-full object-cover" /></div>
      </div>
    </section>

    {/* Studio Location */}
    <section className="max-w-[1200px] mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center bg-[#1C1C1C] mt-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="p-8 md:p-10"
      >
        <p className="uppercase tracking-luxury text-[10px] text-[#D8C4A0] mb-3">Visit the Atelier</p>
        <h3 className="font-serif text-3xl md:text-4xl font-light mb-5">Studio Location</h3>
        <p className="flex items-start gap-3 text-[#F5F1E8] leading-relaxed">
          <MapPin size={18} className="text-[#C6A972] mt-1 shrink-0" />
          <span>{settings?.storeAddress || '12, Linking Road, Bandra West, Mumbai 400050'}</span>
        </p>
        <p className="mt-4 text-sm text-[#A8A8A8]">Mon – Sat · 11am – 7pm · By appointment</p>
        <a href={settings?.storeMapsUrl || 'https://www.google.com/maps/search/?api=1&query=Bandra+West+Mumbai'} target="_blank" rel="noopener noreferrer"
           className="mt-6 inline-flex items-center gap-2 border border-[#C6A972] text-[#C6A972] hover:bg-[#C6A972] hover:text-[#121212] px-6 py-3 text-xs uppercase tracking-luxury transition">
          <MapPin size={14} /> Open in Google Maps
        </a>
      </motion.div>
      <a href={settings?.storeMapsUrl || '#'} target="_blank" rel="noopener noreferrer" className="block aspect-[4/3] bg-[#0a0a0a] relative overflow-hidden group">
        <img src="https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=900&q=80" alt="Mumbai atelier" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-[#F5F1E8]">
            <MapPin size={36} className="text-[#C6A972]" />
            <span className="text-xs uppercase tracking-luxury">View on Maps</span>
          </div>
        </div>
      </a>
    </section>

    {/* Follow */}
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-3xl mx-auto px-6 py-20 text-center"
    >
      <p className="uppercase tracking-luxury text-[10px] text-[#D8C4A0] mb-4">Stay Close</p>
      <h3 className="font-serif text-3xl md:text-4xl font-light mb-8">Follow the Atelier</h3>
      <div className="flex justify-center"><SocialIcons settings={settings} size={20} /></div>
      {settings?.whatsappCommunity && (
        <a href={settings.whatsappCommunity} target="_blank" rel="noopener noreferrer"
           className="mt-8 inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white px-6 py-3 text-xs uppercase tracking-luxury transition">
          <MessageCircle size={16} /> Join our WhatsApp Community
        </a>
      )}
    </motion.section>

    <section className="max-w-3xl mx-auto px-6 py-16">
      <SectionTitle kicker="The Story So Far" title="Our Timeline" />
      <div className="space-y-6">
        {[
          ['2014', 'Founded in a 400 sq ft Bandra studio'],
          ['2017', 'Dressed our first Bollywood A-lister'],
          ['2019', 'Opened the flagship Mumbai atelier'],
          ['2022', 'First international showcase, Dubai'],
          ['2024', 'Launched the Celebrity Edit'],
          ['2025', 'Ten years of slow couture'],
        ].map(([y, t], i) => (
          <motion.div
            key={y}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="flex gap-6 md:gap-8 border-b border-[#C6A972]/20 pb-5"
          >
            <span className="font-serif text-2xl md:text-3xl text-[#C6A972] w-20 md:w-24 shrink-0">{y}</span>
            <span className="text-[#D8C4A0] pt-1.5 md:pt-2 text-sm md:text-base">{t}</span>
          </motion.div>
        ))}
      </div>
    </section>
  </div>
)

/* ------------------------------ Blogs ------------------------------ */
const BlogsView = ({ navigate, blogs }) => (
  <div className="pt-32 pb-24 px-6 max-w-[1400px] mx-auto">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="text-center mb-16"
    >
      <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="uppercase tracking-luxury text-[10px] text-[#D8C4A0] mb-3">The Journal</motion.p>
      <motion.h1 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className="font-serif text-5xl md:text-6xl font-light">Stories from the Atelier</motion.h1>
    </motion.div>
    <div className="grid md:grid-cols-3 gap-10">
      {blogs.map((b, i) => (
        <motion.button
          key={b.id}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => navigate('blog-detail', { id: b.id })}
          className="text-left group"
        >
          <div className="zoom-img aspect-[4/3]"><img src={b.cover} alt={b.title} className="w-full h-full object-cover" /></div>
          <h3 className="font-serif text-2xl mt-5 group-hover:text-[#C6A972] transition">{b.title}</h3>
          <p className="text-sm text-[#A8A8A8] mt-2 line-clamp-3">{b.excerpt}</p>
        </motion.button>
      ))}
    </div>
  </div>
)

const BlogDetailView = ({ blogId, navigate }) => {
  const [blog, setBlog] = useState(null)
  useEffect(() => { api.get(`/blogs/${blogId}`).then(setBlog) }, [blogId])
  if (!blog) return <div className="pt-32 px-6 text-center font-serif italic text-[#A8A8A8]/60">Loading…</div>
  return (
    <article className="pt-32 pb-24 max-w-3xl mx-auto px-6">
      <button onClick={() => navigate('blogs')} className="text-xs uppercase tracking-luxury text-[#A8A8A8] hover:text-[#C6A972] mb-8">← Back to Journal</button>
      <p className="uppercase tracking-luxury text-[10px] text-[#D8C4A0]">Journal</p>
      <h1 className="font-serif text-4xl md:text-5xl font-light mt-3 leading-tight">{blog.title}</h1>
      <div className="zoom-img aspect-[16/9] mt-10"><img src={blog.cover} alt={blog.title} className="w-full h-full object-cover" /></div>
      <div className="mt-10 prose font-serif text-lg leading-relaxed text-[#F5F1E8] whitespace-pre-line">{blog.content}</div>
    </article>
  )
}

/* ------------------------------ Contact ------------------------------ */
const ContactView = ({ settings }) => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [sent, setSent] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    await api.post('/inquiries', form)
    setSent(true)
    setForm({ name: '', email: '', phone: '', message: '' })
  }
  const waNumber = (settings?.whatsappNumber || '+919885525611').replace(/[^0-9]/g, '')
  return (
    <div className="pt-32 pb-24 px-6 max-w-[1400px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-16"
      >
        <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }} className="uppercase tracking-luxury text-[10px] text-[#D8C4A0] mb-3">Get in Touch</motion.p>
        <motion.h1 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className="font-serif text-5xl md:text-6xl font-light">Begin the Conversation</motion.h1>
        <motion.p initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} className="mt-5 font-serif italic text-[#A8A8A8] max-w-xl mx-auto">For consultations, custom orders, and press enquiries.</motion.p>
      </motion.div>
      <div className="grid lg:grid-cols-2 gap-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <h3 className="font-serif text-2xl mb-6">The Atelier</h3>
          <p className="text-[#D8C4A0] mb-6 leading-relaxed">{settings?.storeAddress || '12, Linking Road, Bandra West, Mumbai 400050'}<br/>India</p>
          <div className="space-y-3 text-sm text-[#D8C4A0]">
            <p className="flex items-center gap-3"><Phone size={14} className="text-[#C6A972]" /> {settings?.whatsappNumber || '+91 98855 25611'}</p>
            {settings?.inquiryEmail && <p className="flex items-center gap-3"><Mail size={14} className="text-[#C6A972]" /> {settings.inquiryEmail}</p>}
            {settings?.instagramUrl && <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-[#C6A972]"><Instagram size={14} className="text-[#C6A972]" /> @wardrobe.talks</a>}
          </div>
          <p className="mt-10 uppercase tracking-luxury text-[10px] text-[#D8C4A0] mb-2">Studio hours</p>
          <p className="text-sm text-[#D8C4A0]">Mon – Sat · 11am – 7pm · By appointment</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white px-6 py-3 text-xs uppercase tracking-luxury"><MessageCircle size={16} /> Chat on WhatsApp</a>
            {settings?.whatsappCommunity && (
              <a href={settings.whatsappCommunity} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white px-6 py-3 text-xs uppercase tracking-luxury transition"><MessageCircle size={16} /> Join Community</a>
            )}
          </div>
          <div className="mt-8">
            <p className="uppercase tracking-luxury text-[10px] text-[#D8C4A0] mb-3">Follow</p>
            <SocialIcons settings={settings} />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          {sent ? (
            <div className="bg-[#1C1C1C] p-10 text-center">
              <p className="font-serif text-3xl text-[#C6A972]">Thank you.</p>
              <p className="mt-3 text-sm text-[#A8A8A8] font-serif italic">Your message has been received. We'll be in touch within 24 hours.</p>
              <button onClick={() => setSent(false)} className="mt-6 text-xs uppercase tracking-luxury text-[#C6A972]">Send another</button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <input required placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3.5 bg-[#1C1C1C] border border-[#C6A972]/20 focus:border-[#C6A972] outline-none text-sm" />
              <input required type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3.5 bg-[#1C1C1C] border border-[#C6A972]/20 focus:border-[#C6A972] outline-none text-sm" />
              <input placeholder="Phone (optional)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3.5 bg-[#1C1C1C] border border-[#C6A972]/20 focus:border-[#C6A972] outline-none text-sm" />
              <textarea required rows={6} placeholder="Tell us about your enquiry" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="w-full px-4 py-3.5 bg-[#1C1C1C] border border-[#C6A972]/20 focus:border-[#C6A972] outline-none text-sm" />
              <button type="submit" className="w-full bg-[#C6A972] hover:bg-[#D8C4A0] text-[#121212] py-4 text-xs uppercase tracking-luxury transition">Send Enquiry</button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}

/* ------------------------------ Footer ------------------------------ */
const getAdminUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://wardrobe-talks-admin.netlify.app'
  }
  return process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001'
}

const Footer = ({ navigate, settings }) => (
  <footer className="bg-[#0a0a0a] text-[#F5F1E8]/80 pt-20 pb-8 px-6 border-t border-[#C6A972]/20">
    <div className="max-w-[1400px] mx-auto grid md:grid-cols-4 gap-10">
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-2xl text-[#F5F1E8]">Wardrobe</span>
          <span className="font-serif italic text-lg text-[#D8C4A0]">Talks</span>
        </div>
        <p className="mt-4 text-sm font-serif italic text-white/60">{settings?.brandTagline || 'Where threads tell stories.'}</p>
      </div>
      <div>
        <p className="uppercase tracking-luxury text-[10px] text-[#D8C4A0] mb-4">Explore</p>
        <ul className="space-y-2 text-sm">
          {NAV.map(n => <li key={n.key}><button onClick={() => navigate(n.key)} className="hover:text-[#D8C4A0]">{n.label}</button></li>)}
        </ul>
      </div>
      <div>
        <p className="uppercase tracking-luxury text-[10px] text-[#D8C4A0] mb-4">Atelier</p>
        <a href={settings?.storeMapsUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-[#D8C4A0] flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0" /> <span>{settings?.storeAddress || '12, Linking Road, Bandra West, Mumbai 400050'}</span></a>
        {settings?.inquiryEmail && <p className="text-sm mt-3 flex items-center gap-2"><Mail size={14} /> {settings.inquiryEmail}</p>}
        <p className="text-sm mt-3 flex items-center gap-2"><Phone size={14} /> {settings?.whatsappNumber || '+91 98855 25611'}</p>
      </div>
      <div>
        <p className="uppercase tracking-luxury text-[10px] text-[#D8C4A0] mb-4">Follow</p>
        <SocialIcons settings={settings} size={16} />
        <a href={getAdminUrl()} target="_blank" rel="noopener noreferrer" className="mt-8 inline-block text-[10px] uppercase tracking-luxury text-white/30 hover:text-[#D8C4A0]">Admin</a>
      </div>
    </div>
    <div className="max-w-[1400px] mx-auto mt-16 pt-8 border-t border-white/10 text-[11px] text-white/40 text-center">
      © {new Date().getFullYear()} Wardrobe Talks. All pieces are handcrafted with intention.
    </div>
  </footer>
)

/* ------------------------------ App ------------------------------ */
function App() {
  const [view, setView] = useState('home')
  const [params, setParams] = useState({})
  const [products, setProducts] = useState([])
  const [gallery, setGallery] = useState([])
  const [hero, setHero] = useState([])
  const [settings, setSettings] = useState({})
  const [loaded, setLoaded] = useState(false)

  const navigate = (v, p = {}) => { setView(v); setParams(p); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }) }

  // Fetch ONCE on mount (parallel), not on every view change
  useEffect(() => {
    Promise.all([
      api.get('/products').catch(() => []),
      api.get('/gallery').catch(() => []),
      api.get('/hero').catch(() => []),
      api.get('/settings').catch(() => ({})),
    ]).then(([p, g, h, s]) => {
      const pData = p?.data !== undefined ? p.data : p
      const items = pData && pData.items ? pData.items : Array.isArray(pData) ? pData : []
      if (Array.isArray(items)) setProducts(items)

      const gData = g?.data !== undefined ? g.data : g
      if (Array.isArray(gData)) setGallery(gData)

      const hData = h?.data !== undefined ? h.data : h
      if (Array.isArray(hData)) setHero(hData)

      const sData = s?.data !== undefined ? s.data : s
      if (sData && typeof sData === 'object') setSettings(sData)

      setLoaded(true)
    })
  }, [])

  const renderView = () => {
    switch (view) {
      case 'home': return <HomeView navigate={navigate} products={products} gallery={gallery} settings={settings} hero={hero} />
      case 'women': return <CollectionView navigate={navigate} products={products} category="Women" initialSub={params.sub} />
      case 'collection': return <CollectionView navigate={navigate} products={products} category="Women" initialSub={params.sub} />
      case 'men': return <CollectionView navigate={navigate} products={products} category="Men" />
      case 'celebrity': return <CollectionView navigate={navigate} products={products} category="Celebrity" />
      case 'product': return <ProductView navigate={navigate} productId={params.id} settings={settings} />
      case 'about': return <AboutView settings={settings} />
      case 'contact': return <ContactView settings={settings} />
      default: return <HomeView navigate={navigate} products={products} gallery={gallery} settings={settings} hero={hero} />
    }
  }

  const waNumber = (settings?.whatsappNumber || '+919885525611').replace(/[^0-9]/g, '')

  return (
    <div className="min-h-screen">
      <ToastHost />
      <Header view={view} navigate={navigate} />
      <main className="fade-up">{renderView()}</main>
      <Footer navigate={navigate} settings={settings} />
      <a href={`https://wa.me/${waNumber}?text=Hello%20Wardrobe%20Talks!`} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#1ebe57] text-white p-4 rounded-full shadow-2xl transition hover:scale-105" aria-label="Chat on WhatsApp">
        <MessageCircle size={24} />
      </a>
    </div>
  )
}

export default App
