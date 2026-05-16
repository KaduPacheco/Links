import {
  CalendarClock,
  Clock3,
  ExternalLink,
  FileText,
  Headphones,
  Instagram,
  MessagesSquare,
  MonitorCheck,
  Newspaper,
  PlayCircle,
  ShieldCheck,
  Sparkles
} from "lucide-react";

export const iconOptions = [
  "MonitorCheck",
  "CalendarClock",
  "MessagesSquare",
  "Instagram",
  "Newspaper",
  "FileText",
  "PlayCircle",
  "Headphones",
  "ShieldCheck",
  "Sparkles",
  "ExternalLink"
] as const;

const icons = {
  CalendarClock,
  Clock3,
  ExternalLink,
  FileText,
  Headphones,
  Instagram,
  MessagesSquare,
  MonitorCheck,
  Newspaper,
  PlayCircle,
  ShieldCheck,
  Sparkles
};

type IconName = keyof typeof icons;

export function LinkIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = icons[(name as IconName) || "ExternalLink"] ?? ExternalLink;
  return <Icon className={className} aria-hidden="true" />;
}
