/**
 * Master taxonomy — controlled vocabulary for product library and encyclopedia alignment.
 * Do not use free-text values outside these unions for matching fields.
 */

export type ProductCategory =
  | "all-purpose"
  | "degreaser"
  | "disinfectant"
  | "glass"
  | "bathroom"
  | "toilet"
  | "floor"
  | "stone"
  | "metal"
  | "wood"
  | "kitchen"
  | "appliance"
  | "adhesive remover"
  | "odor eliminator"
  | "mold mildew"
  | "descaler"
  | "abrasive"
  | "polish"
  | "laundry"
  | "drain"
  | "disposal"
  | "specialty";

export type ChemistryFamily =
  | "surfactant"
  | "alkaline"
  | "caustic"
  | "acidic"
  | "oxidizer"
  | "solvent"
  | "abrasive"
  | "enzyme"
  | "disinfectant"
  | "quaternary ammonium"
  | "bleach"
  | "peroxide"
  | "alcohol"
  | "oxalic acid"
  | "ammonia"
  | "ammonia_blend"
  | "neutral"
  | "stainless_polish"
  | "mold_control";

export type ProblemType =
  | "grease buildup"
  | "oil stains"
  | "food residue"
  | "protein residue"
  | "soap scum"
  | "soap residue"
  | "product residue"
  | "hard water stains"
  | "hard water film"
  | "mineral deposits"
  | "limescale"
  | "calcium buildup"
  | "rust stains"
  | "tannin stains"
  | "biofilm"
  | "bio-organic buildup"
  | "bacteria buildup"
  | "mold growth"
  | "mildew stains"
  | "disinfection"
  | "organic stains"
  | "pet odor"
  | "urine"
  | "clog"
  | "floor residue"
  | "odor retention"
  | "preventive maintenance"
  | "burnt residue"
  | "cooked-on residue"
  | "cooked-on grease"
  | "baked-on grease"
  | "light dust"
  | "light film"
  | "laundry odor"
  | "laundry disinfection"
  | "dye transfer"
  | "adhesive residue"
  | "sticky residue"
  | "wax buildup"
  | "dust buildup"
  | "scuff marks"
  | "scratches"
  | "discoloration"
  | "yellowing"
  | "dullness"
  | "cloudy film"
  | "white film"
  | "streaking"
  | "etching"
  | "oxidation"
  | "corrosion"
  | "tarnish"
  | "heat damage"
  | "uneven finish"
  | "fingerprints"
  | "surface haze"
  | "greasy film"
  | "mold staining"
  | "kitchen grease film"
  | "light adhesive residue"
  | "musty odor"
  | "mildew growth"
  | "smudge marks";

export type SurfaceType =
  | "stone"
  | "hardwood floors"
  | "tile floors"
  | "carpet"
  | "upholstery"
  | "drains"
  | "stainless steel"
  | "glass"
  | "tile"
  | "grout"
  | "shower glass"
  | "ceramic"
  | "porcelain"
  | "granite"
  | "marble"
  | "quartz"
  | "sealed stone"
  | "laminate"
  | "vinyl"
  | "plastic"
  | "wood"
  | "sealed wood"
  | "unsealed wood"
  | "painted surfaces"
  | "appliances"
  | "countertops"
  | "floors"
  | "toilets"
  | "sinks"
  | "bathtubs"
  | "garbage cans"
  | "caulking"
  | "metal"
  | "chrome"
  | "brass"
  | "copper"
  | "aluminum"
  | "mirrors"
  | "general household surfaces"
  | "cabinets"
  | "natural stone"
  | "luxury vinyl"
  | "ovens"
  | "cooktops"
  | "range hoods"
  | "laundry"
  | "fabrics"
  | "bedding"
  | "towels"
  | "delicates"
  | "concrete"
  | "finished wood"
  | "hard-surface floors"
  | "grills"
  | "stainless steel appliances"
  | "exterior concrete"
  | "finished stainless"
  | "drywall"
  | "cabinet fronts"
  | "finished appliances"
  | "outdoor concrete"
  | "fabric"
  | "painted trim"
  | "vertical surfaces";

export type RiskFlag =
  | "corrosive"
  | "abrasive damage risk"
  | "etching risk"
  | "discoloration risk"
  | "toxic fumes"
  | "requires ventilation"
  | "ventilation required"
  | "skin irritant"
  | "not food safe"
  | "flammable"
  | "flammability risk"
  | "finish damage risk"
  | "oily residue";

export type ResidueLevel = "none" | "low" | "medium" | "high";

export type ScentLevel = "none" | "low" | "moderate" | "strong";

export type CleaningStrength = "light" | "moderate" | "heavy-duty" | "restoration";

export type CleaningProduct = {
  slug: string;
  name: string;
  brand: string;
  manufacturer?: string;

  category: ProductCategory;
  subcategory?: string;
  chemistry: ChemistryFamily[];
  cleaningStrength: CleaningStrength;

  compatibleProblems: ProblemType[];
  incompatibleProblems?: ProblemType[];

  compatibleSurfaces: SurfaceType[];
  incompatibleSurfaces?: SurfaceType[];

  strengths: string[];
  weaknesses: string[];

  bestUseCases: string[];
  worstUseCases: string[];

  dwellTime?: string;
  requiresRinse: boolean;
  residueLevel: ResidueLevel;

  riskFlags: RiskFlag[];
  ventilationRequired: boolean;
  ppeRequired?: string[];

  scentLevel: ScentLevel;
  notes?: string[];

  manufacturerClaims?: string[];
  sdsAvailable?: boolean;
  epaRegistered?: boolean;
  epaNumber?: string;

  rating?: number;
  reviewCount?: number;
  priceRange?: string;

  replaces?: string[];
  alternatives?: string[];

  confidenceScore: number;
  lastUpdated: string;

  amazonUrl?: string;
  amazonAffiliateUrl?: string;
  isPurchaseAvailable?: boolean;
  buyLabel?: string;
};
