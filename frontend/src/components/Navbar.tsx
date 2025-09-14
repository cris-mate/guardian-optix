import { Box, Heading, VStack, Separator } from '@chakra-ui/react';
import React from 'react';
import { NavItem } from "./NavItem";
import {
  FiActivity, FiBriefcase, FiHome, FiMessageSquare, FiUsers,
  FiRss, FiCalendar, FiCheckSquare, FiClock, FiFileText, FiTrendingUp, FiPieChart
} from 'react-icons/fi';

export const Navbar = () => {
  return (
    <Box
      as="aside"
      bg="#2D3748"
      color="white"
      p={4}
      gridArea="navbar" // Important for Grid layout
      height="100%"
      overflowY="auto"
    >
      <VStack align="stretch" gap={3}>
        <NavItem to='/dashboard' icon={FiHome}>Dashboard</NavItem>
        <NavItem to='/activity' icon={FiActivity}>Activity</NavItem>
        <NavItem to='/clients' icon={FiBriefcase}>Clients</NavItem>
        <NavItem to='/personnel' icon={FiUsers}>Personnel</NavItem>
        <Separator variant="solid" borderColor="gray.600" />

        {/* Section Communication */}
        <Heading
          fontSize="x1"
          fontWeight="normal"
          letterSpacing="wider"
          color="blue.300"
          opacity={0.7}
        >
          Communication
        </Heading>
        <NavItem to='/chat' icon={FiMessageSquare}>Chat</NavItem>
        <NavItem to='/updates' icon={FiRss}>Updates</NavItem>
        <Separator variant="solid" borderColor="gray.600" />

        {/* Section Operations */}
        <Heading
          fontSize="x1"
          fontWeight="normal"
          letterSpacing="wider"
          color="blue.300"
          opacity={0.7}
        >
          Operations
        </Heading>
        <NavItem to='/scheduling' icon={FiCalendar}>Scheduling</NavItem>
        <NavItem to='/taskManager' icon={FiCheckSquare}>Task Manager</NavItem>
        <NavItem to='/timeClock' icon={FiClock}>Time Clock</NavItem>
        <Separator variant="solid" borderColor="gray.600" />

        {/* Section Analytics */}
        <Heading
          fontSize="x1"
          fontWeight="normal"
          letterSpacing="wider"
          color="blue.300"
          opacity={0.7}
        >
          Analytics
        </Heading>
        <NavItem to='/performanceMonitoring' icon={FiTrendingUp}>Performance Monitoring</NavItem>
        <NavItem to='/analytics' icon={FiPieChart}>Analytics</NavItem>
        <Separator variant="solid" borderColor="gray.600" />

        {/* Section Compliance */}
        <NavItem to='/compliance' icon={FiFileText}>Compliance</NavItem>
      </VStack>
    </Box>
  );
};