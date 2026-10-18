import type { Metadata } from 'next'
import './globals.css'
import ConvexClientProvider from '@/components/ConvexClientProvider'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'tractor.games — Trick-Taking Card Games',
  description: 'Play Tractor, Gong Zhu, Wizard, and Skull King online with friends',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
        <footer className="build-footer">
          {process.env.NEXT_PUBLIC_BUILD === 'dev' ? 'dev' : `b${process.env.NEXT_PUBLIC_BUILD}`}
          {process.env.NEXT_PUBLIC_BUILD_NAME ? ` · ${process.env.NEXT_PUBLIC_BUILD_NAME}` : ''}
        </footer>
      </body>
    </html>
  )
}
