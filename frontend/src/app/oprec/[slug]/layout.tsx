import type { Metadata } from 'next';
import { PublicApiService } from '@/lib/api';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  let title = "Open Recruitment BEM FT UNESA";
  let description = "Pendaftaran kepanitiaan dan staf BEM FT UNESA.";
  let imgUrl = "/icon.png";

  try {
    const res = await PublicApiService.getRecruitmentBySlug(params.slug);
    const resData = res?.data as unknown;
    const data = (resData as {data?: typeof resData})?.data || resData || res;
    if (data && typeof data === 'object' && 'title' in data) {
      const typedData = data as {title?: string; description?: string; poster?: string | {url?: string}};
      title = typedData.title || title;
      description = typedData.description || description;
      
      if (typedData.poster) {
        const posterUrl = typeof typedData.poster === 'string' ? typedData.poster : typedData.poster.url;
        imgUrl = (posterUrl && typeof posterUrl === 'string' && posterUrl.startsWith('/'))
          ? `${process.env.NEXT_PUBLIC_API_URL}${posterUrl}` 
          : (posterUrl || imgUrl);
      }
    }
  } catch (error) {
    console.error("Failed to fetch recruitment metadata", error);
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
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

export default function OprecDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
