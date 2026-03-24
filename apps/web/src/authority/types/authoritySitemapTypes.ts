export interface AuthoritySitemapUrlEntry {
  url: string;
  lastModified: string;
}

export interface AuthoritySitemapSection {
  slug: string;
  urls: AuthoritySitemapUrlEntry[];
}
