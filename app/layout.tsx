import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Agent Visualizer - Analytics Dashboard',
  description: 'Visualize and analyze agent performance data',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  )
}
