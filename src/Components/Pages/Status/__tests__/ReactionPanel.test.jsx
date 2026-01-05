import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReactionPanel from '../ReactionPanel';

test('calls onReact when a reaction is tapped (pointer)', () => {
  const handleReact = jest.fn();
  const { getByText } = render(<ReactionPanel userReaction={""} counts={{}} onReact={handleReact} />);

  const emoji = getByText('😂');
  // Simulate pointerUp which we use for touch/mouse
  fireEvent.pointerUp(emoji);

  expect(handleReact).toHaveBeenCalledWith('😂');
});
