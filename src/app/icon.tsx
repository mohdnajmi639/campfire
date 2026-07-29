import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FFB067 0%, #E8622B 100%)',
          borderRadius: '50%',
        }}
      >
        <span style={{ fontSize: 320 }}>🔥</span>
      </div>
    ),
    { ...size }
  )
}
