import type { PlaceholderToken } from '../models/translation';

export interface PlaceholderExtractor {
  extract(value: string): PlaceholderToken[];
}
