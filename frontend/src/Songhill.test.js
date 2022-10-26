import { render, screen } from '@testing-library/react';
import Songhill from './Songhill';

test('renders songhill test', () => {
  render(<Songhill />);
  const linkElement = screen.getByText(/songhill/i);
  expect(linkElement).toBeInTheDocument();
});
