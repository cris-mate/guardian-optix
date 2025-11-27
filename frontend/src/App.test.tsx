import React from 'react';
import { render, screen } from '@testing-library/react';
import Homepage from './pages/Homepage';
import { MemoryRouter } from 'react-router-dom';

test('renders homepage welcome heading', () => {
  render(
    <MemoryRouter>
      <Homepage />
    </MemoryRouter>
  );
  const headingElement = screen.getByText(/Welcome to Guardian Optix/i);
  expect(headingElement).toBeInTheDocument();
});