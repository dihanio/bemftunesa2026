import type { Metadata } from 'next';
import { PublicApiService } from '@/lib/api';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  let title = "Open Recruitment BEM FT UNESA";
  let description = "Pendaftaran kepanitiaan dan staf BEM FT UNESA.";
  let imgUrl = "/icon.png";

  try {
    const res = await PublicApiService.getRecruitmentBySlug(params.slug);
    const data = res?.data?.data || res?.data || res;
    if (data && data.title) {
      title = data.title;
      description = data.description || description;
      
      if (data.poster) {
        imgUrl = data.poster.startsWith('/') 
          ? `${process.env.NEXT_PUBLIC_API_URL}${data.poster}` 
          : data.poster;
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
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
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
