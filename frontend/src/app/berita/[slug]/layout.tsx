import type { Metadata } from 'next';
import { PublicApiService } from '@/lib/api';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  let title = "Berita BEM FT UNESA";
  let description = "Baca berita terbaru dari BEM FT UNESA.";
  let imgUrl = "/icon.png";

  try {
    const res = await PublicApiService.getNewsBySlug(params.slug);
    const data = res.data;
    if (data && data.title) {
      title = data.title;
      // Strip HTML tags for description if content is HTML
      description = data.summary || (typeof data.content === 'string' ? data.content.replace(/<[^>]+>/g, '').substring(0, 160) + '...' : '');
      
      if (data.thumbnailUrl) {
        imgUrl = data.thumbnailUrl.startsWith('/') 
          ? `${process.env.NEXT_PUBLIC_API_URL}${data.thumbnailUrl}` 
          : data.thumbnailUrl;
      }
    }
  } catch (error) {
    console.error("Failed to fetch news metadata", error);
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: [imgUrl]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imgUrl]
    },
  };
}

export default function BeritaDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
