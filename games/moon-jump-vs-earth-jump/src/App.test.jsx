import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';

describe('Moon Jump vs Earth Jump', () => {
  it('shows planet learning messages when selecting planets', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /moon/i }));
    expect(screen.getByText(/gentle gravity/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /jupiter/i }));
    expect(screen.getByText(/powerful gravity/i)).toBeInTheDocument();
  });

  it('lets players add and select a custom gravity object', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByLabelText(/object/i));
    await user.type(screen.getByLabelText(/object/i), 'Comet');
    fireEvent.submit(screen.getByRole('button', { name: /add object/i }).closest('form'));

    await waitFor(() => expect(screen.getByRole('button', { name: /comet/i })).toBeInTheDocument());
    expect(screen.getByText(/comet gravity added/i)).toBeInTheDocument();
  });

  it('uses requestAnimationFrame and supports spacebar jumps', () => {
    const requestSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    render(<App />);
    fireEvent.keyDown(window, { code: 'Space' });

    expect(requestSpy).toHaveBeenCalled();

    requestSpy.mockRestore();
    cancelSpy.mockRestore();
  });
});
