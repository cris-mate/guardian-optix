import { Box, Heading, VStack, Separator } from '@chakra-ui/react';
import React from 'react';
import { NavItem } from "../components/custom ui/NavItem";
import {
  FiActivity, FiBriefcase, FiHome, FiUsers, FiCalendar, FiClock, FiFileText, FiSettings, FiTrendingUp, FiPieChart
} from 'react-icons/fi';

export const Navbar = () => {
  return (
    <Box
      as="aside"
      bg="#2626d9"
      color="gray.300"
      p={3}
      gridArea="navbar"
      height="100%"
      overflowY="auto"
    >
      <VStack align="stretch" gap={2}>
        <NavItem to='/dashboard' icon={FiHome}>Dashboard</NavItem>
        <NavItem to='/activityHub' icon={FiActivity}>Activity Hub</NavItem>
        <NavItem to='/clients' icon={FiBriefcase}>Clients</NavItem>

        <Separator variant="solid" borderColor="gray.600" />

        {/* Section Workforce */}
        <Heading
          size="lg"
          fontWeight="normal"
          letterSpacing="wider"
          color="blue.200"
          opacity={0.7}
        >
          Workforce
        </Heading>
        <NavItem to='/guards' icon={FiUsers}>Guards</NavItem>
        <NavItem to='/compliance' icon={FiFileText}>Compliance</NavItem>
        <Separator variant="solid" borderColor="gray.600" />

        {/* Section Operations */}
        <Heading
          size="lg"
          fontWeight="normal"
          letterSpacing="wider"
          color="blue.200"
          opacity={0.7}
        >
          Operations
        </Heading>
        <NavItem to='/scheduling' icon={FiCalendar}>Scheduling</NavItem>
        <NavItem to='/timeClock' icon={FiClock}>Time Clock</NavItem>
        <Separator variant="solid" borderColor="gray.600" />

        {/* Section Analytics */}
        <Heading
          size="lg"
          fontWeight="normal"
          letterSpacing="wider"
          color="blue.200"
          opacity={0.7}
        >
          Analytics
        </Heading>
        <NavItem to='/performance' icon={FiTrendingUp}>Performance</NavItem>
        <NavItem to='/analytics' icon={FiPieChart}>Reports</NavItem>
        <Separator variant="solid" borderColor="gray.600" />

        {/* Section Settings */}
        <NavItem to='/settings' icon={FiSettings}>Settings</NavItem>
      </VStack>
    </Box>
  );
};