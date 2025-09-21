import React from 'react';
import { Grid, GridItem } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const RootLayout = () => {
  return (
    <Grid
      templateAreas={`"header header"
                      "sidebar main"
                      "footer footer"`}
      gridTemplateRows={'auto 1fr auto'} // Header row takes its own height, the rest fills the screen
      gridTemplateColumns={'250px 1fr'} // Navbar is 250px wide, main content takes the rest
      h="100vh" // Full viewport height
      w="100vw" // Full viewport width
      bg="gray.100" // Main background for the app
    >
      <GridItem area={'header'}><Header /></GridItem>
      <GridItem area={'sidebar'}><Navbar /></GridItem>
      <GridItem area={'main'} p="8" overflowY="auto">
        {/* Page-specific content will be rendered here by the Outlet*/}
        <Outlet />
      </GridItem>
      <GridItem area={'footer'}><Footer /></GridItem>
    </Grid>
  );
};

export default RootLayout;