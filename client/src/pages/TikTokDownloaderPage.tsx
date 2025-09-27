import DownloadInterface from "@/components/download-interface";

export default function TikTokDownloaderPage() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
          TikTok Video Downloader Without Watermark
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Save your favorite TikTok videos without the watermark using MediaGrabber. Our free TikTok downloader lets you save videos in high-quality MP4 format quickly and easily.
        </p>
      </div>
      <DownloadInterface />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 text-left space-y-4">
        <h2 className="text-2xl font-bold">How to Download TikTok Videos</h2>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>Find the TikTok video you want to download and copy its link.</li>
          <li>Paste the URL into the download box above.</li>
          <li>Choose the video quality you prefer.</li>
          <li>Click the download button and the video will be saved to your device, watermark-free.</li>
        </ol>
         <p className="text-sm text-muted-foreground">
          Support a good cause with every high-quality download you make.
        </p>
      </div>
    </div>
  );
}
