import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['600', '700'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'POPs Drogaria – Documentos Profissionais para Farmácias',
  description: 'Procedimentos Operacionais Padrão personalizados para drogarias e farmácias.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${playfair.variable} ${dmSans.variable} font-body bg-cream-100`}>
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  )
}
