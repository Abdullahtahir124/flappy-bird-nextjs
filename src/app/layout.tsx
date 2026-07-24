import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Flappy Bird Game',
  description: 'A browser-based Flappy Bird game built with Next.js',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover', // Handle notched devices
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        padding: 0,
        overflow: 'hidden', // Prevent scrolling
        touchAction: 'none', // Prevent default touch behaviors
        userSelect: 'none', // Prevent text selection
        WebkitUserSelect: 'none', // Safari
        WebkitTouchCallout: 'none', // Disable callout on iOS
        WebkitTapHighlightColor: 'transparent', // Remove tap highlight
      }}>
        {children}
      </body>
    </html>
  )
}