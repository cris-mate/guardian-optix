import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import './MainLayout.css'

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    // Main container for the layout
    <div className="main-layout">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;