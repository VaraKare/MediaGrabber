import { youtubeDl } from 'youtube-dl-exec';

export async function getFormats(url: string): Promise<any> {
  try {
    const metadata = await youtubeDl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      callHome: false,
      noCheckCertificates: true,
    });
    return metadata;
  } catch (error) {
    console.error("Error fetching formats with yt-dlp:", error);
    throw new Error("Failed to fetch formats");
  }
}

