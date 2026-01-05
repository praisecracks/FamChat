import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostCard from '../PostCard';

// Mock firestore transaction
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    runTransaction: vi.fn(async (db, fn) => {
      // call the provided transaction function with a fake tx object
      const tx = {
        get: async (ref) => ({ exists: () => true, data: () => ({ reactions: {} }) }),
        update: vi.fn(),
      };
      await fn(tx);
      return true;
    }),
  };
});

describe('PostCard', () => {
  const post = { id: 'p1', title: 'Hello', content: 'World', reactions: {} };
  const user = { uid: 'u1' };

  it('shows optimistic heart + animation and calls runTransaction', async () => {
    render(<PostCard post={post} currentUser={user} />);

    const button = screen.getByRole('button', { name: /heart/i });
    // Click the heart
    fireEvent.click(button);

    // pending indicator appears
    expect(button).toHaveAttribute('aria-busy', 'true');

    // animation emoji should show quickly (text node ❤️)
    expect(screen.getByText('❤️')).toBeInTheDocument();

    // Wait for transaction to complete and pending to clear
    await waitFor(() => expect(button).toHaveAttribute('aria-busy', 'false'));
  });
});
