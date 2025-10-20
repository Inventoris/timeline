import type { Metadata } from 'next'
import { PT_Sans, Bebas_Neue } from 'next/font/google'
import '@/styles/global.scss'
import '@/styles/components/timeline-block/timeline-block.scss'

const ptSans = PT_Sans({
  weight: ['400', '700'],
  variable: '--font-pt-sans'
})

const bebasNeue = Bebas_Neue({
  weight: '400',
  variable: '--font-bebas-neue'
})

export const metadata: Metadata = {
  title: 'Исторические промежутки',
  description: 'Компонент для отображения исторических дат (промежутков) с важными событиями'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className={`${ptSans.variable} ${bebasNeue.variable}`}>
        {children}
      </body>
    </html>
  )
}
