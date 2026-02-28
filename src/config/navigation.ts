export interface SocialLink {
  label: string;
  href: string;
  iconSrc: string;
}

export interface SidebarTocItem {
  label: string;
  targetId: string;
}

export const socialLinks: SocialLink[] = [
  {
    label: 'X',
    href: 'https://x.com/fulldecent',
    iconSrc: '/images/icons/socials/x-white.png',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@fulldecent',
    iconSrc: '/images/icons/socials/youtube-white.png',
  },
  {
    label: 'Twitch',
    href: 'https://www.twitch.tv/fulldecent',
    iconSrc: '/images/icons/socials/twitch-white.png',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/fulldecent/',
    iconSrc: '/images/icons/socials/linkedin-white.png',
  },
  {
    label: 'GitHub',
    href: 'https://github.com/fulldecent',
    iconSrc: '/images/icons/socials/github-white.png',
  },
];
