
import React from 'react';

export type ServiceType = 
  | 'end_of_lease' 
  | 'regular' 
  | 'spring_deep' 
  | 'window' 
  | 'office' 
  | 'pressure_washing' 
  | 'steam_cleaning';

export type FrequencyType = 'Weekly' | 'Fortnightly' | 'Monthly';
export type PressureWashingMode = 'manhours' | 'sq_meters';
export type PropertyCategory = 'Residential' | 'Commercial';

export interface PropertyDetails {
  storeys: string;
  bedrooms: string;
  bathrooms: string;
  category?: PropertyCategory;
}

export interface ServiceExtra {
  id: string;
  name: string;
  price: number;
  helperText?: string;
  icon: React.ReactNode;
}

export interface ServiceInclusion {
  id: string;
  name: string;
  description: string;
}

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  cleanerInstructions: string;
  lat?: number;
  lon?: number;
}

export interface ServicePricing {
  basePrices: Record<string, number>;
  storeyPrices: Record<string, number>;
  bathroomPrices: Record<string, number>;
  extrasPrices: Record<string, number>;
  frequencyDiscounts?: Record<string, number>;
  hourlyRate?: number; 
  minutesPerWindow?: number; 
  
  // Window Specific Type Pricing
  resWindowMinutes?: number;
  resWindowHourly?: number;
  commWindowMinutes?: number;
  commWindowHourly?: number;
  
  // Pressure washing specific
  preferredPressureMode?: PressureWashingMode;
  residentialPressureHourlyRate?: number;
  residentialCostPerSqMeter?: number;
  commercialPressureHourlyRate?: number;
  commercialCostPerSqMeter?: number;
}

export interface PdfField {
  id: string;
  label: string;
  placeholder: string;
  visible: boolean;
  fontWeight: 'normal' | 'bold';
  fontSize: number;
}

export interface PdfSection {
  id: string;
  title: string;
  visible: boolean;
  backgroundColor: string;
  textColor: string;
  fields: PdfField[];
}

export interface PdfTemplateConfig {
  header: {
    title: string;
    showLogo: boolean;
    bgColor: string;
  };
  sections: PdfSection[];
  footer: {
    text: string;
    visible: boolean;
  };
}

export interface PricingConfig {
  services: Record<ServiceType, ServicePricing>;
  pdfTemplate?: PdfTemplateConfig;
}

export interface BookingState {
  serviceId: ServiceType;
  property: PropertyDetails;
  selectedExtras: string[];
  customer: CustomerDetails;
  date: string;
  timeSlot: string;
  isWeekend: boolean;
  isHome: boolean;
  isFurnished: boolean;
  hasPower: boolean;
  hasWater: boolean;
  frequency?: FrequencyType;
  preferredDays?: string[];
  windowCount?: number; 
  pressureMode?: PressureWashingMode; 
  pressureManhours?: number; 
  pressureSqMeters?: number;
  travelDistance?: number;
  travelFee?: number;
  isVictoria?: boolean;
}
