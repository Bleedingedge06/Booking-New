
import React from 'react';
import { 
  Home, Bed, Bath, Wind, Waves, Warehouse, Snowflake, 
  Maximize, Layout, Waves as SteamIcon, Wallpaper, Ghost, 
  Zap, MapPin, Eraser, Sparkles, Clock, ShieldCheck, 
  Building2, Droplets, Grid, ListChecks, Blinds as BlindsIcon,
  ShieldPlus
} from 'lucide-react';
import { ServiceExtra, ServiceInclusion, PricingConfig, ServiceType, ServicePricing, PdfTemplateConfig } from './types';

export interface EnhancedInclusion extends ServiceInclusion {
  details: string[];
}

export const SERVICES: { id: ServiceType; title: string; icon: React.ReactNode; description: string }[] = [
  { id: 'end_of_lease', title: 'End of Lease Cleaning', icon: <ShieldCheck />, description: 'Full bond recovery guaranteed professional deep clean.' },
  { id: 'regular', title: 'Regular Cleaning', icon: <Clock />, description: 'Weekly or fortnightly maintenance for a clean lifestyle.' },
  { id: 'spring_deep', title: 'Spring / Deep Cleaning', icon: <Sparkles />, description: 'Intensive top-to-bottom seasonal refreshment.' },
  { id: 'window', title: 'Window Cleaning', icon: <Wind />, description: 'Crystal clear results for interior and exterior glass.' },
  { id: 'office', title: 'Office Cleaning', icon: <Building2 />, description: 'Professional sanitization for commercial workspaces.' },
  { id: 'pressure_washing', title: 'Pressure Washing', icon: <Droplets />, description: 'High-pressure removal of dirt from driveways and walls.' },
  { id: 'steam_cleaning', title: 'Steam Cleaning', icon: <SteamIcon />, description: 'Deep carpet and upholstery stain removal.' }
];

export const PROPERTY_OPTIONS = {
  storeys: ['1 Storey', '2 Storeys', '3 Storeys', '4 Storeys', '5+ Storeys'],
  bedrooms: ['1 Bedroom', '2 Bedrooms', '3 Bedrooms', '4 Bedrooms', '5+ Bedrooms'],
  bathrooms: ['1 Bathroom', '2 Bathrooms', '3 Bathrooms', '4 Bathrooms', '5+ Bathrooms']
};

export const TIME_SLOTS = [
  '08:00 AM - 10:00 AM',
  '10:00 AM - 12:00 PM',
  '12:00 PM - 02:00 PM',
  '02:00 PM - 04:00 PM'
];

export const WINDOW_INCLUSIONS: EnhancedInclusion[] = [
  { id: 'win-inc-1', name: 'Spotless Window Cleaning', description: 'Crystal clear finish', details: ['Dual-side glass cleaning', 'Streak-free chemical treatment'] },
  { id: 'win-inc-2', name: 'Wipe down of windowsills', description: 'Sill sanitization', details: ['Dust removal', 'Wipe down of internal sills'] }
];

export const WINDOW_ADDONS: Omit<ServiceExtra, 'price'>[] = [
  { id: 'win-ex-flyscreen', name: 'FlyScreen', icon: <Grid className="w-5 h-5" /> },
  { id: 'win-ex-tracks', name: 'Tracks and Ledges', icon: <ListChecks className="w-5 h-5" /> },
  { id: 'win-ex-blinds', name: 'Blinds', icon: <BlindsIcon className="w-5 h-5" /> },
];

export const INCLUSIONS: EnhancedInclusion[] = [
  { 
    id: 'inc-1', 
    name: 'Bathroom', 
    description: 'Deep clean of all surfaces, toilets, and tiles',
    details: [
      'Cleaning of all tiled floors', 'Clean mirrors and glass surfaces', 'Clean all tile surfaces',
      'Clean all bench tops', 'Clean all sinks, taps and handles', 'Clean bathtub',
      'Clean shower screens', 'Clean mirrors', 'Deep scrub and clean of toilet',
      'Clean internal vanity cupboards', 'Clean internal medicine cabinets', 'Clean all soap holders',
      'Clean exhaust fan', 'Clean high touch areas', 'Clean light fittings',
      'Remove dust from skirting boards', 'Clean all door and window frames'
    ]
  },
  { 
    id: 'inc-2', 
    name: 'Living Spaces', 
    description: 'Dusting, vacuuming, and mopping',
    details: [
      'Remove cobwebs throughout', 'Clean fixtures (switches/handles)', 'Clean high touch areas',
      'Remove dust and clean fans', 'Clean outlets', 'Skirting boards', 'Light fittings',
      'Vents cleaning', 'Door/window frames', 'Vacuum/mop flooring'
    ]
  },
  { 
    id: 'inc-3', 
    name: 'Wardrobes / Cupboards', 
    description: 'Internal and external wipe down',
    details: [
      'Tracks and frames vacuumed', 'Shelves/drawers cleaned', 'Adhesives removed', 'Glass surfaces'
    ]
  },
  { 
    id: 'inc-4', 
    name: 'Laundry', 
    description: 'Floor and surface sanitization',
    details: [
      'Lint removal', 'Exhaust fan clean', 'Tile floors', 'Sink and tubs', 'Skirting boards'
    ]
  },
  { 
    id: 'inc-5', 
    name: 'Kitchen', 
    description: 'Degreasing of splashbacks and countertops',
    details: [
      'Degrease all surfaces', 'External cupboards', 'Sinks and taps', 'Dishwasher clean',
      'Stove top detail', 'Range hood detail', 'Splash backs', 'Internal cupboards'
    ]
  },
  { 
    id: 'inc-6', 
    name: 'Pantry', 
    description: 'Internal vacuum and sanitization',
    details: [ 'Clean all shelves', 'Clean all drawers', 'Doors/handles' ]
  }
];

export const EXTRAS_DEFS: Omit<ServiceExtra, 'price'>[] = [
  { id: 'ex-1', name: 'Additional Balcony', icon: <Layout className="w-5 h-5" /> },
  { id: 'ex-2', name: 'Outside Window Cleaning', icon: <Wind className="w-5 h-5" /> },
  { id: 'ex-3', name: 'Garage Cleaning', icon: <Warehouse className="w-5 h-5" /> },
  { id: 'ex-4', name: 'Fridge Cleaning', icon: <Snowflake className="w-5 h-5" /> },
  { id: 'ex-5', name: 'Double Fridge Cleaning', icon: <Snowflake className="w-5 h-5" /> },
  { id: 'ex-6', name: 'Living Area', icon: <Maximize className="w-5 h-5" /> },
  { id: 'ex-7', name: 'Carpet Steam Cleaning', icon: <SteamIcon className="w-5 h-5" /> },
  { id: 'ex-8', name: 'Wall Washing', icon: <Wallpaper className="w-5 h-5" /> },
  { id: 'ex-9', name: 'Blinds Cleaning', icon: <Eraser className="w-5 h-5" /> },
  { id: 'ex-10', name: 'Miscellaneous', helperText: 'Add custom requests in notes', icon: <Ghost className="w-5 h-5" /> },
  { id: 'ex-11', name: 'Pressure Washing', icon: <Waves className="w-5 h-5" /> },
  { id: 'ex-12', name: 'Travel Fee', helperText: 'Applied if property is over 50km from CBD', icon: <MapPin className="w-5 h-5" /> },
  { id: 'ex-13', name: 'Urgent Job', helperText: 'Required within 24 hours', icon: <Zap className="w-5 h-5" /> },
];

export const DEFAULT_PDF_TEMPLATE: PdfTemplateConfig = {
  header: { title: "CENVIRA QUOTATION", showLogo: true, bgColor: "#354F52" },
  sections: [
    {
      id: "client", title: "CLIENT DOSSIER", visible: true, backgroundColor: "#ffffff", textColor: "#354F52",
      fields: [
        { id: "name", label: "Name", placeholder: "{{firstName}} {{lastName}}", visible: true, fontWeight: "normal", fontSize: 11 },
        { id: "email", label: "Identity", placeholder: "{{email}}", visible: true, fontWeight: "normal", fontSize: 11 },
        { id: "phone", label: "Contact", placeholder: "{{phone}}", visible: true, fontWeight: "normal", fontSize: 11 },
        { id: "address", label: "Deployment Site", placeholder: "{{address}}", visible: true, fontWeight: "normal", fontSize: 11 }
      ]
    },
    {
      id: "service", title: "SERVICE SPECIFICATIONS", visible: true, backgroundColor: "#ffffff", textColor: "#354F52",
      fields: [
        { id: "protocol", label: "Protocol", placeholder: "{{serviceTitle}}", visible: true, fontWeight: "normal", fontSize: 11 },
        { id: "schedule", label: "Schedule", placeholder: "{{date}} @ {{timeSlot}}", visible: true, fontWeight: "normal", fontSize: 11 },
        { id: "params", label: "Parameters", placeholder: "{{details}}", visible: true, fontWeight: "normal", fontSize: 11 },
        { id: "instr", label: "Special Instructions", placeholder: "{{cleanerInstructions}}", visible: true, fontWeight: "normal", fontSize: 11 }
      ]
    }
  ],
  footer: { text: "This quotation is subject to property inspection.", visible: true }
};

const createEmptyPricing = (baseMultiplier = 1, isRegular = false, isWindow = false, isPressure = false): ServicePricing => ({
  basePrices: { '1 Bedroom': 230 * baseMultiplier, '2 Bedrooms': 290 * baseMultiplier, '3 Bedrooms': 380 * baseMultiplier, '4 Bedrooms': 480 * baseMultiplier, '5+ Bedrooms': 590 * baseMultiplier },
  storeyPrices: { '1 Storey': 0, '2 Storeys': 40, '3 Storeys': 80, '4 Storeys': 120, '5+ Storeys': 160 },
  bathroomPrices: { '1 Bathroom': 0, '2 Bathrooms': 45, '3 Bathrooms': 90, '4 Bathrooms': 135, '5+ Bathrooms': 180 },
  extrasPrices: [...EXTRAS_DEFS, ...WINDOW_ADDONS].reduce((acc, extra) => ({ ...acc, [extra.id]: 50 }), {}),
  frequencyDiscounts: isRegular ? { 'Weekly': 20, 'Fortnightly': 10, 'Monthly': 0 } : undefined,
  
  // Window Specifics
  resWindowMinutes: isWindow ? 10 : undefined,
  resWindowHourly: isWindow ? 80 : undefined,
  commWindowMinutes: isWindow ? 15 : undefined,
  commWindowHourly: isWindow ? 110 : undefined,
  
  // Pressure Specifics
  preferredPressureMode: isPressure ? 'manhours' : undefined,
  residentialPressureHourlyRate: isPressure ? 95 : undefined,
  residentialCostPerSqMeter: isPressure ? 12 : undefined,
  commercialPressureHourlyRate: isPressure ? 135 : undefined,
  commercialCostPerSqMeter: isPressure ? 18 : undefined
});

export const DEFAULT_PRICING: PricingConfig = {
  services: {
    end_of_lease: createEmptyPricing(1),
    regular: createEmptyPricing(0.6, true),
    spring_deep: createEmptyPricing(1.2),
    window: createEmptyPricing(0.4, false, true),
    office: createEmptyPricing(0.8),
    pressure_washing: createEmptyPricing(0.7, false, false, true),
    steam_cleaning: createEmptyPricing(0.5)
  },
  pdfTemplate: DEFAULT_PDF_TEMPLATE
};
