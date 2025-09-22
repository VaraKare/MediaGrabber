import youtubedl from 'youtube-dl-exec';
import { z } from 'zod';

const formatSchema = z.object({
  format_id: z.string().optional(),
  ext: z.string().optional(),
  resolution: z.string().optional(),
  vcodec: z.string().optional(),
  acodec: z.string().optional(),
  filesize: z.number().nullable().optional(),
});

type Format = z.infer<typeof formatSchema>;

export async function getFormats(url: string): Promise<any> {
  try {
    const output = await youtubedl(url, {
      dumpJson: true,
      noWarnings: true,
      noCheckCertificates: true,
    });

    const data = JSON.parse(output as any);
    return data;
  } catch (error) {
    console.error('Error fetching formats with yt-dlp:', error);
    throw new Error('Failed to fetch formats');
  }
}