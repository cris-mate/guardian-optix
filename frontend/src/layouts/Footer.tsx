import React from 'react';
import {Flex, Text} from '@chakra-ui/react';

export const Footer= () => {

  return (
    <Flex
      as="footer"
      align="center"
      justify="center"
      p={5}
      bg="#1b1b60"
      color="gray.300"
      boxShadow="md"
      gridArea="footer"
    >
      <Text>
        &copy; {new Date().getFullYear()} Guardian Optix. All rights reserved.
      </Text>
    </Flex>
  );
};

