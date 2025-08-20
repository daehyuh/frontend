import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Toaster } from "@/components/ui/toaster"
import { LoadingProvider } from '@/contexts/loading-context'
import './globals.css'

export const metadata: Metadata = {
  title: 'AEGIS(아이기스) | AI 편집에도 견고한 워터마크, 원본 보호',
  description: '원본의 소유권은 보이지 않게 지켜주고, 조작의 흔적은 명백한 증거로 보여줍니다.',
  keywords: ['이미지 보호', '워터마크', 'AI 검증', '위변조 탐지', '이미지 보안', 'AEGIS'],
  authors: [{ name: 'AEGIS Team' }],
  creator: 'AEGIS',
  publisher: 'AEGIS',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: 'https://aegis.gdgoc.com/favicon.ico', sizes: 'any' },
      { url: 'https://aegis.gdgoc.com/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: 'https://aegis.gdgoc.com/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: 'https://aegis.gdgoc.com/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { 
        url: 'https://aegis.gdgoc.com/android-chrome-192x192.png', 
        sizes: '192x192', 
        type: 'image/png',
        rel: 'icon',
      },
      { 
        url: 'https://aegis.gdgoc.com/android-chrome-512x512.png', 
        sizes: '512x512', 
        type: 'image/png',
        rel: 'icon',
      },
    ],
  },
  manifest: 'https://aegis.gdgoc.com/site.webmanifest',
  openGraph: {
    title: 'AEGIS - AI 편집도 속일 수 없는 워터마크 기술',
    description: '딥러닝 기반 보이지 않는 표식이 원본의 소유권을 지켜주고, 조작의 흔적은 눈에 보이는 증거로 드러냅니다.',
    url: 'https://aegis.gdgoc.com',
    siteName: 'AEGIS',
    images: [
      {
        url: 'https://aegis.gdgoc.com/image.png',
        width: 1200,
        height: 630,
        alt: 'AEGIS - AI 편집도 속일 수 없는 워터마크 기술',
      },
      {
        url: 'https://aegis.gdgoc.com/logo.png',
        width: 250,
        height: 250,
        alt: 'AEGIS 로고',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AEGIS - AI 편집도 속일 수 없는 워터마크 기술',
    description: '딥러닝 기반 보이지 않는 표식이 원본의 소유권을 지켜주고, 조작의 흔적은 눈에 보이는 증거로 드러냅니다.',
    images: ['https://aegis.gdgoc.com/image.png'],
    creator: '@aegis_ai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={GeistSans.className}>
        <LoadingProvider>
          {children}
          <Toaster />
        </LoadingProvider>
      </body>
    </html>
  )
}
