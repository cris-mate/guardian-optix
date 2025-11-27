import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders homepage heading', () => {
  render(<App />);
  const heading = screen.getByText(/Welcome to Guardian Optix/i);
  expect(heading).toBeInTheDocument();
});
