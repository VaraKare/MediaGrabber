import { youtubeDl } from 'youtube-dl-exec';
import { log } from './utils'; // Import the centralized logging utility

export async function getFormats(url: string): Promise<any> {
  log(`Starting yt-dlp to fetch formats for URL: ${url}`, 'yt-dlp');
  const startTime = process.hrtime.bigint();

  try {
    const metadata = await youtubeDl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true, 
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      skipDownload: true,
      ignoreConfig: true,
    });
    const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000; // Convert to milliseconds
    log(`yt-dlp successfully fetched formats for ${url} in ${duration.toFixed(2)}ms.`, 'yt-dlp');
    return metadata;
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - startTime) / 1_000_000;
    log(`Error fetching formats with yt-dlp for ${url} in ${duration.toFixed(2)}ms.`, 'yt-dlp');
    // Log the full command and stderr if available for better debugging on Render
    if (error instanceof Error && 'stderr' in error && 'command' in error) {
      log(`yt-dlp command: ${error.command}`, 'yt-dlp');
      log(`yt-dlp stderr: ${error.stderr}`, 'yt-dlp');
    }
    throw new Error(`Failed to fetch formats with yt-dlp: ${(error as Error).message}`);
  }
}
