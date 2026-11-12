import { Building, Bed, Text, Square } from 'lucide-react'
import { Button } from './Button'

export interface PropertyCardProps {
  imageUrl: string
  title: string
  bedrooms: number
  bathrooms: number
  area: number
  actions?: React.ReactNode
}

export function PropertyCard({ imageUrl, title, bedrooms, bathrooms, area, actions }: PropertyCardProps) {
  return (
    <div className="group bg-card rounded-lg overflow-shadow p-4 transition-transform hover:hover:scale-105 duration-200">
      <img
        src={imageUrl}
        alt={title}
        className="w-full h-48 object-cover rounded-md mb-3"
      />
      <h3 className="font-medium text-foreground line-clamp-2">{title}</h3>
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex items-center gap-1 text-muted">
          <Building className="w-2 h-2" /> {bedrooms} bed
        </div>
        <div className="flex items-center gap-1 text-muted">
          <Text className="w-2 h-2" /> {bathrooms} bath
        </div>
        <div className="flex items-center gap-1 text-muted">
          <Square className="w-2 h-2" /> {area} sqft
        </div>
      </div>
      {actions && <Button>{actions}</Button>}
    </div>
  )
}