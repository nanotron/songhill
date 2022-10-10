import { render, screen } from '@testing-library/react';
import App from './App';

test('renders songhill test', () => {
  render(<App />);
  const linkElement = screen.getByText(/songhill/i);
  expect(linkElement).toBeInTheDocument();
});
