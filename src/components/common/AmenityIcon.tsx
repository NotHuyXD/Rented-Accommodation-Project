import React from 'react';
import { 
  Wifi, 
  Snowflake, 
  Refrigerator, 
  Utensils, 
  Cctv, 
  Car, 
  WashingMachine, 
  ChevronsUpDown, 
  Bed, 
  Tv, 
  CheckCircle2, 
  Shirt,
  Wind
} from 'lucide-react';

interface AmenityIconProps {
  iconName?: string;
  size?: number;
  className?: string;
}

export function AmenityIcon({ iconName, size = 16, className = '' }: AmenityIconProps) {
  if (!iconName) {
    return <CheckCircle2 size={size} className={className} />;
  }

  const name = iconName.toLowerCase();
  
  if (name.includes('wifi')) return <Wifi size={size} className={className} />;
  if (name.includes('ac') || name.includes('điều hòa')) return <Snowflake size={size} className={className} />;
  if (name.includes('fridge') || name.includes('tủ lạnh')) return <Refrigerator size={size} className={className} />;
  if (name.includes('kitchen') || name.includes('bếp')) return <Utensils size={size} className={className} />;
  if (name.includes('camera')) return <Cctv size={size} className={className} />;
  if (name.includes('parking') || name.includes('xe')) return <Car size={size} className={className} />;
  if (name.includes('washing') || name.includes('giặt')) return <WashingMachine size={size} className={className} />;
  if (name.includes('elevator') || name.includes('thang')) return <ChevronsUpDown size={size} className={className} />;
  if (name.includes('bed') || name.includes('giường')) return <Bed size={size} className={className} />;
  if (name.includes('tv') || name.includes('tivi')) return <Tv size={size} className={className} />;
  if (name.includes('wardrobe') || name.includes('tủ quần áo')) return <CheckCircle2 size={size} className={className} />;

  // Default fallback
  return <CheckCircle2 size={size} className={className} />;
}
