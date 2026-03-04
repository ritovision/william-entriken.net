export type SocialId = "x" | "youtube" | "twitch" | "linkedin" | "github";

export interface SocialLink {
  id: SocialId;
  label: string;
  href: string;
}

export const socialLinks: SocialLink[] = [
  {
    id: "x",
    label: "X",
    href: "https://x.com/fulldecent",
  },
  {
    id: "youtube",
    label: "YouTube",
    href: "https://www.youtube.com/@fulldecent",
  },
  {
    id: "twitch",
    label: "Twitch",
    href: "https://www.twitch.tv/fulldecent",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/fulldecent/",
  },
  {
    id: "github",
    label: "GitHub",
    href: "https://github.com/fulldecent",
  },
];
