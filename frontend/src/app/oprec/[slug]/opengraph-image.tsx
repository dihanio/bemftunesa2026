import { ImageResponse } from 'next/og';
import { PublicApiService } from '@/lib/api';

export const alt = 'BEM FT UNESA Open Recruitment';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const res = await PublicApiService.getRecruitmentBySlug(params.slug).catch(() => null);
  const data = res?.data;
  const title = data?.title || 'Open Recruitment BEM FT UNESA';
  
  // Convert relative API URL to absolute if necessary, or use fallback
  let imgUrl = typeof data?.poster === 'string' ? data.poster : data?.poster?.url;
  if (imgUrl && typeof imgUrl === 'string' && imgUrl.startsWith('/')) {
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
                background: data?.status === 'open' ? '#10b981' : '#ef4444', 
                color: '#fff',
                padding: '8px 24px',
                borderRadius: '999px',
                fontSize: '24px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
              }}
            >
              {data?.status === 'open' ? 'DIBUKA' : (data?.status === 'closed' ? 'DITUTUP' : 'DIUMUMKAN')}
            </div>
            <div style={{ color: '#a7f3d0', fontSize: '24px', marginLeft: '24px' }}>
              REKRUTMEN {data?.period || 'BEM FT UNESA'}
            </div>
          </div>
          <h1
            style={{
              color: 'white',
              fontSize: '72px',
              fontWeight: '900',
              lineHeight: 1.1,
              margin: 0,
              fontFamily: 'sans-serif',
            }}
          >
            {title}
          </h1>
        </div>
      </div>
    ),
    { ...size }
  );
}
