export type ServiceAreaCity = {
  slug: string;
  name: string;
  stateCode: string;
  regionName: string;
  shortDescription: string;
  longDescription: string;
  problemSlugs: string[];
  surfaceSlugs: string[];
  serviceSlugs: string[];
};

export type LocalServiceDefinition = {
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  relatedProblemSlugs: string[];
  relatedSurfaceSlugs: string[];
  relatedMethodSlugs: string[];
  relatedToolSlugs: string[];
};

export type ServiceAreaIndexItem = {
  slug: string;
  name: string;
  href: string;
  shortDescription: string;
  serviceCount: number;
};

export type LocalEntityLink = {
  slug: string;
  name: string;
  href: string;
  summary?: string;
};

export type ServiceAreaPageData = {
  city: ServiceAreaCity;
  services: LocalServiceDefinition[];
  relatedProblems: LocalEntityLink[];
  relatedSurfaces: LocalEntityLink[];
};

export type ServiceAreaServicePageData = {
  city: ServiceAreaCity;
  service: LocalServiceDefinition;
  relatedProblems: LocalEntityLink[];
  relatedSurfaces: LocalEntityLink[];
  relatedMethods: LocalEntityLink[];
  relatedTools: LocalEntityLink[];
};

export type ServiceAreaMetadataKind = "index" | "city" | "service-city";
