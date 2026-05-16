import React from 'react';
import { Link } from 'react-router-dom';
import logoFull from '../../assets/9.svg';
import logoIcon from '../../assets/8.svg';
import { useSystemConfig } from '../../context/SystemConfigContext';

const Logo = ({ variant = 'full', className = '', size = 'md' }) => {
  const { config } = useSystemConfig();
  const siteName = config.site_name || 'BASTICKET';

  const sizeClasses = {
    sm: variant === 'icon' ? 'w-8 h-8' : 'h-8',
    md: variant === 'icon' ? 'w-10 h-10' : 'h-10',
    lg: variant === 'icon' ? 'w-20 h-20' : 'h-20',
    xl: variant === 'icon' ? 'w-28 h-28' : 'h-28',
  };

  const logoSrc = variant === 'icon' ? logoIcon : logoFull;
  
  return (
    <Link to="/" className={`flex items-center space-x-2 group transition-transform active:scale-95 ${className}`}>
      <img 
        src={logoSrc} 
        alt={siteName} 
        className={`${sizeClasses[size] || sizeClasses.md} w-auto object-contain transition-all duration-300 group-hover:brightness-110 group-hover:drop-shadow-[0_0_8px_rgba(82,196,45,0.4)]`}
      />
      {variant === 'withText' && (
        <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase transition-colors group-hover:text-neon-green">
          {siteName}
        </span>
      )}
    </Link>
  );
};

export default Logo;
