import DownloadInterface from "@/components/download-interface";

export default function TwitterDownloaderPage() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
          Twitter (X) Video Downloader
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Save videos from Twitter (now X) with our simple and free video downloader. MediaGrabber allows you to download videos from tweets in MP4 format.
        </p>
      </div>
      <DownloadInterface />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 text-left space-y-4">
        <h2 className="text-2xl font-bold">How to Download Twitter Videos</h2>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Go to the tweet that contains the video you want to save and copy its URL.</li>
            <li>Paste the tweet's link into the download bar.</li>
            <li>Choose your desired video quality.</li>
            <li>Click the "Download" button to start saving the video.</li>
        </ol>
        <p className="text-sm text-muted-foreground">
            Contribute to charity with every high-quality video you download from Twitter.
        </p>
      </div>
    </div>
  );
}
