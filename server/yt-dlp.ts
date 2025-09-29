import { youtubeDl } from 'youtube-dl-exec';

export async function getFormats(url: string): Promise<any> {
  try {
    const metadata = await youtubeDl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      // The '--no-call-home' option is deprecated, so removing it to clean up warnings.
      // yt-dlp generally discourages disabling certificate checks unless absolutely necessary.
      // Keeping it for now but be aware of security implications.
      noCheckCertificates: true, 
      // Add a User-Agent to mimic a browser, which helps bypass bot detection.
      // This string is relatively common and can help avoid basic bot checks.
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      // Ensure we only fetch info, not download the video itself
      skipDownload: true,
      // Suppress output about configuration files, which can sometimes be noisy
      ignoreConfig: true,
    });
    return metadata;
  } catch (error) {
    console.error("Error fetching formats with yt-dlp:", error);
    // Log the full command and stderr if available for better debugging on Render
    if (error instanceof Error && 'stderr' in error && 'command' in error) {
      console.error(`yt-dlp command: ${error.command}`);
      console.error(`yt-dlp stderr: ${error.stderr}`);
    }
    throw new Error("Failed to fetch formats");
  }
}

