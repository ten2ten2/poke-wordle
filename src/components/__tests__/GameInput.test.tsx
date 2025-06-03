/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameInput from '../GameInput';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      'game.inputPlaceholder': 'Enter Pokemon name...',
      'game.submit': 'Submit',
      'game.submitting': 'Submitting...',
      'game.randomStart': 'Random Start',
      'game.giveUp': 'Give Up',
      'game.restart': 'Restart'
    };
    return translations[key] || key;
  })
}));

// Create mock props
const mockPokemonNames = ['Bulbasaur', 'Ivysaur', 'Venusaur', 'Charmander'];
const mockOnSubmit = jest.fn();
const mockOnRandomStart = jest.fn();
const mockOnGiveUp = jest.fn();
const mockOnRestart = jest.fn();

const defaultProps = {
  pokemonNames: mockPokemonNames,
  onSubmit: mockOnSubmit,
  onRandomStart: mockOnRandomStart,
  onGiveUp: mockOnGiveUp,
  onRestart: mockOnRestart,
  disabled: false,
  gameStarted: false,
  gameOver: false
};

describe('GameInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders input field', () => {
    render(<GameInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Enter Pokemon name...');
  });

  test('shows autocomplete suggestions on typing', async () => {
    const user = userEvent.setup();
    render(<GameInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    
    await act(async () => {
      await user.type(input, 'Bulb');
    });
    
    await waitFor(() => {
      expect(screen.getByText('Bulbasaur')).toBeInTheDocument();
    });
  });

  test('filters suggestions based on input', async () => {
    const user = userEvent.setup();
    render(<GameInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    
    await act(async () => {
      await user.type(input, 'Char');
    });
    
    await waitFor(() => {
      expect(screen.getByText('Charmander')).toBeInTheDocument();
      expect(screen.queryByText('Bulbasaur')).not.toBeInTheDocument();
    });
  });

  test('calls onSubmit when valid Pokemon is submitted via Enter', async () => {
    const user = userEvent.setup();
    render(<GameInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    
    await act(async () => {
      await user.type(input, 'Bulbasaur');
      await user.keyboard('{Enter}');
    });
    
    expect(mockOnSubmit).toHaveBeenCalledWith('Bulbasaur');
  });

  test('calls onSubmit when submit button is clicked', async () => {
    const user = userEvent.setup();
    render(<GameInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    const submitButton = screen.getByText('Submit');
    
    await act(async () => {
      await user.type(input, 'Bulbasaur');
      await user.click(submitButton);
    });
    
    expect(mockOnSubmit).toHaveBeenCalledWith('Bulbasaur');
  });

  test('does not call onSubmit for empty input', async () => {
    const user = userEvent.setup();
    render(<GameInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    
    await act(async () => {
      await user.click(input);
      await user.keyboard('{Enter}');
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('disables input when disabled prop is true', () => {
    render(<GameInput {...defaultProps} disabled={true} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  test('disables input when game is over', () => {
    render(<GameInput {...defaultProps} gameOver={true} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  test('clears input after successful guess', async () => {
    const user = userEvent.setup();
    render(<GameInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox') as HTMLInputElement;
    
    await act(async () => {
      await user.type(input, 'Bulbasaur');
      await user.keyboard('{Enter}');
    });
    
    expect(input.value).toBe('');
  });

  test('handles keyboard navigation in suggestions', async () => {
    const user = userEvent.setup();
    render(<GameInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    
    await act(async () => {
      await user.type(input, 'B');
    });
    
    // Wait for suggestions to appear
    await waitFor(() => {
      expect(screen.getByText('Bulbasaur')).toBeInTheDocument();
    });
    
    // Check that we have suggestions visible
    const bulbasaurSuggestion = screen.getByText('Bulbasaur');
    expect(bulbasaurSuggestion).toBeInTheDocument();
    
    await act(async () => {
      // Navigate with arrow keys to select first suggestion
      await user.keyboard('{ArrowDown}');
    });
    
    // Wait a bit for the selection to take effect
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await act(async () => {
      // Press Enter to select the highlighted suggestion
      await user.keyboard('{Enter}');
    });
    
    // Wait for the input value to be updated
    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe('Bulbasaur');
    }, { timeout: 1000 });
    
    // Suggestions should be hidden after selection
    await waitFor(() => {
      expect(screen.queryByText('Bulbasaur')).not.toBeInTheDocument();
    });
  });

  test('handles suggestion click', async () => {
    const user = userEvent.setup();
    render(<GameInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    
    await act(async () => {
      await user.type(input, 'Bulb');
    });
    
    await waitFor(() => {
      expect(screen.getByText('Bulbasaur')).toBeInTheDocument();
    });
    
    await act(async () => {
      await user.click(screen.getByText('Bulbasaur'));
    });
    
    expect((input as HTMLInputElement).value).toBe('Bulbasaur');
  });

  test('trims whitespace from input', async () => {
    const user = userEvent.setup();
    render(<GameInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    
    await act(async () => {
      await user.type(input, '  Bulbasaur  ');
      await user.keyboard('{Enter}');
    });
    
    expect(mockOnSubmit).toHaveBeenCalledWith('Bulbasaur');
  });

  test('shows random start button when game not started', () => {
    render(<GameInput {...defaultProps} gameStarted={false} />);
    
    const randomStartButton = screen.getByText('Random Start');
    expect(randomStartButton).toBeInTheDocument();
  });

  test('shows give up button when game started', () => {
    render(<GameInput {...defaultProps} gameStarted={true} />);
    
    const giveUpButton = screen.getByText('Give Up');
    expect(giveUpButton).toBeInTheDocument();
  });

  test('calls onRandomStart when random start button clicked', async () => {
    const user = userEvent.setup();
    render(<GameInput {...defaultProps} gameStarted={false} />);
    
    const randomStartButton = screen.getByText('Random Start');
    
    await act(async () => {
      await user.click(randomStartButton);
    });
    
    expect(mockOnRandomStart).toHaveBeenCalled();
  });

  test('calls onGiveUp when give up button clicked', async () => {
    const user = userEvent.setup();
    render(<GameInput {...defaultProps} gameStarted={true} />);
    
    const giveUpButton = screen.getByText('Give Up');
    
    await act(async () => {
      await user.click(giveUpButton);
    });
    
    expect(mockOnGiveUp).toHaveBeenCalled();
  });

  test('calls onRestart when restart button clicked', async () => {
    const user = userEvent.setup();
    render(<GameInput {...defaultProps} />);
    
    const restartButton = screen.getByText('Restart');
    
    await act(async () => {
      await user.click(restartButton);
    });
    
    expect(mockOnRestart).toHaveBeenCalled();
  });

  test('submit button is disabled when input is empty', () => {
    render(<GameInput {...defaultProps} />);
    
    const submitButton = screen.getByText('Submit');
    expect(submitButton).toBeDisabled();
  });

  test('submit button is enabled when input has text', async () => {
    const user = userEvent.setup();
    render(<GameInput {...defaultProps} />);
    
    const input = screen.getByRole('textbox');
    const submitButton = screen.getByText('Submit');
    
    await act(async () => {
      await user.type(input, 'Bulbasaur');
    });
    
    expect(submitButton).not.toBeDisabled();
  });
}); 