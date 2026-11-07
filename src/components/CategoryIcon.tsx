import React from 'react';
import {
  ShoppingBag,
  Utensils,
  Train,
  Home,
  Tag,
  HeartPulse,
  Film,
  ArrowDownLeft,
  Receipt,
} from 'lucide-react';
import { ExpenseCategory } from '../types';
import { CATEGORY_META } from '../data/demoData';

interface CategoryIconProps {
  category: ExpenseCategory;
  size?: 'sm' | 'md' | 'lg';
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ category, size = 'md' }) => {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.Other;

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
  }[size];

  const iconSize = size === 'sm' ? 16 : size === 'md' ? 18 : 22;

  const renderGlyph = () => {
    switch (category) {
      case 'Groceries':
        return <ShoppingBag size={iconSize} />;
      case 'Food & Dining':
        return <Utensils size={iconSize} />;
      case 'Transport':
        return <Train size={iconSize} />;
      case 'Housing & Bills':
        return <Home size={iconSize} />;
      case 'Shopping':
        return <Tag size={iconSize} />;
      case 'Health & Wellness':
        return <HeartPulse size={iconSize} />;
      case 'Entertainment':
        return <Film size={iconSize} />;
      case 'Income':
        return <ArrowDownLeft size={iconSize} />;
      default:
        return <Receipt size={iconSize} />;
    }
  };

  return (
    <div
      className={`${sizeClasses} ${meta.bgClass} ${meta.textClass} flex items-center justify-center shrink-0 transition-transform`}
      aria-hidden="true"
    >
      {renderGlyph()}
    </div>
  );
};
