export type CoverageFeedKind = 'press' | 'speaking';

export interface CoverageFeedItemBase {
  key: string;
  date: string;
  title: string;
  url: string;
}

export interface PressCoverageItem extends CoverageFeedItemBase {
  authors: string[];
  publication: string;
}

export type SpeakingEventItem = CoverageFeedItemBase;

export type CoverageFeedItem = PressCoverageItem | SpeakingEventItem;
