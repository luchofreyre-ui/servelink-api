export interface AuthorityBreadcrumbItem {
  label: string;
  href: string;
}

export interface AuthoritySeeAlsoGroup {
  title: string;
  links: {
    title: string;
    href: string;
    description?: string;
  }[];
}
