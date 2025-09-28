import { youtubeDl } from 'youtube-dl-exec';

export async function getFormats(url: string): Promise<any> {
  try {
    const metadata = await youtubeDl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      callHome: false, // Deprecated, but good to keep explicitly for older versions
      noCheckCertificates: true,
      // Add a User-Agent to mimic a browser, which helps bypass bot detection
      // It's important to use a realistic user agent string.
      // You might need to update this periodically if YouTube changes its detection.
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    return metadata;
  } catch (error) {
    console.error("Error fetching formats with yt-dlp:", error);
    throw new Error("Failed to fetch formats");
  }
}
