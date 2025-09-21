import { Grid, GridItem } from '@chakra-ui/react';
import React from 'react';
import { Header } from './Header';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface MainLayoutProps {
  children: React.ReactNode; // Allows the layout to wrap any page content
}

export const RootLayout = ({ children }: MainLayoutProps) => {
  return (
    <Grid
      templateAreas={`"header header"
                      "sidebar main"
                      "footer footer"`}
      gridTemplateRows={'auto 1fr'} // Header row takes its own height, the rest fills the screen
      gridTemplateColumns={'250px 1fr'} // Navbar is 250px wide, main content takes the rest
      h="100vh" // Full viewport height
      w="100vw" // Full viewport width
      bg="#34ebe8" // Main background for the app
    >
      <GridItem area={'header'}>
        <Header />
      </GridItem>
      <GridItem area={'sidebar'}>
        <Navbar />
      </GridItem>
      <GridItem area={'main'} p="8" overflowY="auto">
        {/* Page-specific content will be rendered here */}
        {children}
      </GridItem>
      <GridItem area={'footer'}>
        <Footer />
      </GridItem>
    </Grid>
  );
};

export default RootLayout;