import { ImageResponse } from 'next/og';
import { PublicApiService } from '@/lib/api';

export const alt = 'BEM FT UNESA Berita';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const res = await PublicApiService.getNewsBySlug(params.slug).catch(() => null);
  const news = res?.data;
  const title = news?.title || 'Berita BEM FT UNESA';
  
  // Convert relative API URL to absolute if necessary, or use fallback
  let imgUrl = news?.thumbnailUrl;
  if (imgUrl && imgUrl.startsWith('/')) {
    imgUrl = `${process.env.NEXT_PUBLIC_API_URL}${imgUrl}`;
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          background: '#0a1913',
          width: '100%',
          height: '100%',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          position: 'relative',
        }}
      >
        {imgUrl && (
          <img
            src={imgUrl}
            alt={title}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.8,
            }}
          />
        )}
        
        {/* Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60%',
            background: 'linear-gradient(to top, rgba(10, 25, 19, 1), rgba(10, 25, 19, 0))',
          }}
        />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '60px', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
            <div
              style={{
                background: '#eab308', // accent-gold
                color: '#000',
                padding: '8px 24px',
                borderRadius: '999px',
                fontSize: '24px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
              }}
            >
              {news?.category || 'BERITA'}
            </div>
            <div style={{ color: '#a7f3d0', fontSize: '24px', marginLeft: '24px' }}>
              BEM FT UNESA
            </div>
          </div>
          <h1
            style={{
              color: 'white',
              fontSize: '64px',
              fontWeight: '900',
              lineHeight: 1.2,
              margin: 0,
              marginBottom: '20px',
              fontFamily: 'sans-serif',
            }}
          >
            {title}
          </h1>
          {news?.author && (
            <div style={{ color: '#e2e8f0', fontSize: '28px' }}>
              Oleh: {typeof news.author === 'string' ? news.author : news.author.name}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
