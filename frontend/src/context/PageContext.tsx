import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the shape of our context data
interface PageTitleContextType {
  title: string;
  setTitle: (title: string) => void;
}

// Create the context with a default value
const PageContext = createContext<PageTitleContextType | undefined>(undefined);

// Create a provider component that will wrap our app
export const PageTitleProvider = ({ children }: { children: ReactNode }) => {
  const [title, setTitle] = useState('Dashboard'); // Default title

  return (
    <PageContext.Provider value={{ title, setTitle }}>
      {children}
    </PageContext.Provider>
  );
};

// Create a custom hook to easily use the context
export const usePageTitle = () => {
  const context = useContext(PageContext);
  if (context === undefined) {
    throw new Error('usePageTitle must be used within a PageTitleProvider');
  }
  return context;
};

export default PageTitleProvider;

