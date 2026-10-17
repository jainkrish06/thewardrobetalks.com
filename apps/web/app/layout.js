import './globals.css'
import { Providers } from './providers'
import { Marcellus, Inter } from 'next/font/google'

const marcellus = Marcellus({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-serif',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata = {
  title: 'Wardrobe Talks — Luxury Couture by Aanya Kapoor',
  description: 'A Mumbai-based couture house specialising in bridal lehengas, anarkalis, and bespoke ethnic wear. Browse the lookbook and enquire directly.',
  keywords: 'luxury indian couture, bridal lehenga, designer anarkali, sharara, wedding wear, indian fashion, Aanya Kapoor',
  openGraph: {
    title: 'Wardrobe Talks — Luxury Couture',
    description: 'Where threads tell stories. Bridal couture, lehengas, anarkalis & more.',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${marcellus.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body className="font-sans bg-[#121212] text-[#F5F1E8] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
