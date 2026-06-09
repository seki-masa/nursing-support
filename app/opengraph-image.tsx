import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/site'

export const runtime = 'edge'
export const alt = SITE_NAME
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: '-0.02em' }}>
          {SITE_NAME}
        </div>
        <div style={{ marginTop: 24, fontSize: 32, opacity: 0.9 }}>
          介護施設向けバイタル管理クラウド
        </div>
      </div>
    ),
    { ...size }
  )
}
