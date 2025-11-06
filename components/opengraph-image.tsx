import { ImageResponse } from 'next/og';
import LogoIcon from './icons/logo';
// Force edge runtime for OG image generation to avoid Node URL/file path issues on some platforms
export const runtime = 'edge';

export type Props = {
  title?: string;
};

export default async function OpengraphImage(
  props?: Props
): Promise<ImageResponse> {
  const { title } = {
    ...{
      title: process.env.SITE_NAME
    },
    ...props
  };

  // In the edge runtime we can't use Node fs; fetch the font as an ArrayBuffer instead.
  const fontUrl = new URL('../fonts/Inter-Bold.ttf', import.meta.url);
  const fontRes = await fetch(fontUrl.href);
  const fontBuffer = await fontRes.arrayBuffer();
  const font = fontBuffer;

  return new ImageResponse(
    (
      <div tw="flex h-full w-full flex-col items-center justify-center bg-black">
        <div tw="flex flex-none items-center justify-center border border-neutral-700 h-[160px] w-[160px] rounded-3xl">
          <LogoIcon width="64" height="58" fill="white" />
        </div>
        <p tw="mt-12 text-6xl font-bold text-white">{title}</p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: font,
          style: 'normal',
          weight: 700
        }
      ]
    }
  );
}
