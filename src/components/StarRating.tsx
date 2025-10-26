import React from 'react';
import { StarFilledIcon, StarIcon } from './icons';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  maxRating = 5, 
  size = 16, 
  className = '' 
}) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: maxRating }, (_, index) => {
        const isFilled = index < rating;
        return isFilled ? (
          <StarFilledIcon 
            key={index} 
            size={size} 
            className="text-yellow-400" 
          />
        ) : (
          <StarIcon 
            key={index} 
            size={size} 
            className="text-gray-300" 
          />
        );
      })}
    </div>
  );
};
