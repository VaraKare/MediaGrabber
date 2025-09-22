import { spawn } from 'child_process';
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

export function getFormats(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const args = [
      url,
      '--dump-json',
      '--no-warnings',
      '--no-check-certificates',
      '--user-agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
    ];

    const ytDlpProcess = spawn('yt-dlp', args);

    let stdout = '';
    let stderr = '';

    ytDlpProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ytDlpProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ytDlpProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const data = JSON.parse(stdout);
          resolve(data);
        } catch (error) {
          console.error('Error parsing yt-dlp JSON output:', error);
          reject(new Error('Failed to parse video formats.'));
        }
      } else {
        console.error(`yt-dlp process exited with code ${code}: ${stderr}`);
        // Try to extract the core error message from stderr
        const errorLine = stderr.split('\n').find(line => line.startsWith('ERROR:'));
        reject(new Error(errorLine || 'Failed to fetch video information.'));
      }
    });

    ytDlpProcess.on('error', (err) => {
        console.error('Failed to start yt-dlp process.', err);
        reject(new Error('Failed to start video processing service.'));
    });
  });
}