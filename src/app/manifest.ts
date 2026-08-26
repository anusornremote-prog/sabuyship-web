import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sabuy Ship Express - ขนส่งและนำเข้าสินค้าจีน-ไทย',
    short_name: 'SabuyShip',
    description: 'บริการนำเข้าสินค้าจากจีนถึงไทยอย่างมืออาชีพ รวดเร็ว ปลอดภัย ตรวจสอบสถานะได้ 24 ชั่วโมง',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1e3a8a',
    orientation: 'portrait',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/Sabuy_Ship_Express.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/Sabuy_Ship_Express.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
