import DownloadInterface from "@/components/download-interface";

export default function YouTubeDownloaderPage() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
          Free YouTube Video Downloader
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Easily download your favorite YouTube videos and shorts in high quality with MediaGrabber. Our fast and secure YouTube downloader allows you to save videos in MP4 format or convert them to MP3 audio.
        </p>
      </div>
      <DownloadInterface />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 text-left space-y-4">
        <h2 className="text-2xl font-bold">How to Download YouTube Videos</h2>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
          <li>Copy the URL of the YouTube video or short you want to download.</li>
          <li>Paste the link into the input box above.</li>
          <li>Select your preferred format (MP4 or MP3) and quality.</li>
          <li>Click download to save the video to your device.</li>
        </ol>
        <p className="text-sm text-muted-foreground">
          Every high-quality download supports our charitable initiatives, helping you make a difference while you download.
        </p>
      </div>
    </div>
  );
}
