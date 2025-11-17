import React from 'react';
import EmpatifyLogo from './EmpatifyLogo';

/**
 * Header component for the landing page
 * Positions the Empatify logo in the top right
 */
export const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="flex justify-end items-center">
        <EmpatifyLogo />
      </div>
    </header>
  );
};

export default Header;









