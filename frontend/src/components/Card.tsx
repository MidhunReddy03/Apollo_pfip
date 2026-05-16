import { HTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/helpers';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  gradient?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, gradient = false, children, ...props }, ref) => {
    const Component = hover ? motion.div : 'div';
    
    return (
      <Component
        ref={ref}
        {...(hover && {
          whileHover: { y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' },
          transition: { duration: 0.2 }
        })}
        className={cn(
          'bg-white rounded-xl shadow-soft overflow-hidden transition-all duration-200',
          gradient && 'bg-gradient-to-br from-white to-gray-50',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

export default Card;
