import DownloadInterface from "@/components/download-interface";

export default function FacebookDownloaderPage() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
          Facebook Video Downloader
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
         Download videos from Facebook with MediaGrabber, your free and easy-to-use tool. Save public Facebook videos, watch-party streams, and reels directly to your device.
        </p>
      </div>
      <DownloadInterface />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 text-left space-y-4">
        <h2 className="text-2xl font-bold">How to Download Facebook Videos</h2>
         <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Copy the URL of the Facebook video you wish to download.</li>
            <li>Paste the video link into the provided input box.</li>
            <li>Select the video quality you want.</li>
            <li>Click on the "Download" button to save the video.</li>
        </ol>
        <p className="text-sm text-muted-foreground">
          Each high-quality download you make helps support our charitable partners.
        </p>
      </div>
    </div>
  );
}
