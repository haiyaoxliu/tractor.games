import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import './globals.css'

const ConvexClientProvider = dynamic(
  () => import('@/components/ConvexClientProvider'),
  { ssr: false }
)

export const metadata: Metadata = {
  title: 'Tractor Games',
  description: 'Play the popular trick-taking card game Tractor',
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
      </body>
    </html>
  )
}
