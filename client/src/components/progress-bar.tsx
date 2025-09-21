
import { Progress } from "./ui/progress";

interface ProgressBarProps {
  progress: number;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return <Progress value={progress} />;
}
