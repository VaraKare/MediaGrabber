import DownloadInterface from "@/components/download-interface";

export default function InstagramDownloaderPage() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
          Instagram Video and Reels Downloader
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Download Instagram Reels, videos, and stories effortlessly with MediaGrabber. Our tool allows you to save any public Instagram video content in high-quality MP4 format.
        </p>
      </div>
      <DownloadInterface />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 text-left space-y-4">
        <h2 className="text-2xl font-bold">How to Download from Instagram</h2>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Copy the link of the Instagram Reel, video, or Story.</li>
            <li>Paste it into the input field on our downloader.</li>
            <li>Select the desired quality for your download.</li>
            <li>Click "Download" to save the content.</li>
        </ol>
         <p className="text-sm text-muted-foreground">
          Your high-quality downloads help us support charitable projects around the world.
        </p>
      </div>
    </div>
  );
}
