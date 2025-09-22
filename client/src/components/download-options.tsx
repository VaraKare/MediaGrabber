import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Skeleton } from "./ui/skeleton";
import React from "react";
import { Resolution, VideoInfo } from "@/types/download";

interface DownloadOptionsProps {
  videoInfo: VideoInfo | null;
  selectedFormat: string;
  setSelectedFormat: React.Dispatch<React.SetStateAction<"mp3" | "mp4">>;
  selectedResolution: string;
  setSelectedResolution: React.Dispatch<React.SetStateAction<Resolution>>;
  selectedBitrate: string;
  setSelectedBitrate: React.Dispatch<React.SetStateAction<string>>;
  isFetchingFormats: boolean;
}

export function DownloadOptions({ videoInfo, selectedFormat, setSelectedFormat, selectedResolution, setSelectedResolution, selectedBitrate, setSelectedBitrate, isFetchingFormats }: DownloadOptionsProps) {
  const mp4Resolutions = videoInfo?.formats.find((f) => f.format === 'mp4')?.resolutions || [];
  const mp3Bitrates = videoInfo?.formats.find((f) => f.format === 'mp3')?.bitrates || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="format">Format</Label>
        <Select value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as "mp3" | "mp4")}>
          <SelectTrigger>
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mp4">MP4</SelectItem>
            <SelectItem value="mp3">MP3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedFormat === 'mp4' && (
        <div className="space-y-2">
          <Label htmlFor="resolution">Resolution</Label>
          {isFetchingFormats ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedResolution} onValueChange={(value) => setSelectedResolution(value as Resolution)}>
              <SelectTrigger>
                <SelectValue placeholder="Select resolution" />
              </SelectTrigger>
              <SelectContent>
                {mp4Resolutions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {selectedFormat === 'mp3' && (
        <div className="space-y-2">
          <Label htmlFor="bitrate">Bitrate</Label>
          {isFetchingFormats ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedBitrate} onValueChange={(value) => setSelectedBitrate(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select bitrate" />
              </SelectTrigger>
              <SelectContent>
                {mp3Bitrates.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  );
}
