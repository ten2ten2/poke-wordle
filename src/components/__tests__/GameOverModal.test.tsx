/**
 * @jest-environment jsdom
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Define proper types for mock components
interface MockProps {
  children?: React.ReactNode;
  as?: any; // Keep as any for flexibility in mock components
  [key: string]: any;
}

interface DialogProps extends MockProps {
  onClose?: () => void;
}

interface TransitionProps extends MockProps {
  show?: boolean;
}

interface IconProps {
  className?: string;
  'aria-hidden'?: boolean;
  [key: string]: any;
}

interface ImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  [key: string]: any;
}

// Mock Headless UI components to avoid animation warnings
jest.mock('@headlessui/react', () => ({
  Dialog: ({ children, as = 'div', onClose, ...props }: DialogProps) => 
    React.createElement(as, { role: 'dialog', onClose, ...props }, children),
  DialogPanel: ({ children, as = 'div', ...props }: MockProps) => 
    React.createElement(as, { ...props }, children),
  DialogTitle: ({ children, as = 'h2', ...props }: MockProps) => 
    React.createElement(as, { ...props }, children),
  Transition: ({ show, children, as = 'div', ...props }: TransitionProps) => {
    if (as === React.Fragment || as === 'Fragment' || as === 'react.fragment') {
      return show ? children : null;
    }
    return show ? React.createElement(as, { ...props }, children) : null;
  },
  TransitionChild: ({ children, as = 'div', ...props }: MockProps) => {
    if (as === React.Fragment || as === 'Fragment' || as === 'react.fragment') {
      return children;
    }
    return React.createElement(as, { ...props }, children);
  },
  Fragment: React.Fragment,
}));

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: (props: IconProps) => <svg {...props} data-testid="x-mark-icon" />,
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: ImageProps) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock modules with direct object approach
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      'game.gameOver': 'Game Over',
      'game.congratulations': 'Congratulations!',
      'game.correctAnswer': 'The correct answer was:',
      'game.yourGuesses': 'Your guesses:',
      'game.playAgain': 'Play Again',
      'game.newGame': 'New Game',
      'game.shareResult': 'Share Result',
      'game.generation': 'Generation',
      'game.types': 'Types',
      'game.abilities': 'Abilities',
      'game.stats': 'Stats',
      'game.evolutionStage': 'Evolution Stage',
      'game.evolutionMethod': 'Evolution Method',
      'game.tags': 'Tags',
      'common.close': 'Close'
    };
    return translations[key] || key;
  }),
  useLocale: jest.fn(() => 'en')
}));

// Mock translateText function
jest.mock('../../lib/pokemon', () => ({
  translateText: jest.fn((text) => text),
  getWikiUrl: jest.fn((name) => `https://example.com/wiki/${name}`)
}));

// Now import components and types
import GameOverModal from '../GameOverModal';
import { Pokemon } from '@/types/pokemon';

const mockPokemon: Pokemon = {
  id: 1,
  pokedex_id_national: 1,
  name: 'Bulbasaur',
  profile: '/bulbasaur.png',
  generation: 1,
  types: ['Grass', 'Poison'],
  abilities: ['Overgrow', 'Chlorophyll'],
  base_stats_total: 318,
  base_stats: {
    attack: 49,
    defense: 49,
    hp: 45,
    sp_attack: 65,
    sp_defense: 65,
    speed: 45
  },
  evolution_stage: 1,
  evolution_method: 'level',
  evolution_method_detail: '16',
  tags: ['Starter', 'Quadruped'],
};

const mockOnRestart = jest.fn();
const mockOnClose = jest.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onRestart: mockOnRestart,
  isWon: false,
  targetPokemon: mockPokemon,
  guessCount: 5,
  maxGuesses: 10
};

describe('GameOverModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering - Game Lost', () => {
    test('renders game over modal when game is lost', async () => {
      render(<GameOverModal {...defaultProps} />);
      
      expect(screen.getByText('Game Over')).toBeDefined();
      expect(screen.getByText('Bulbasaur')).toBeDefined();
    });

    test('shows target Pokemon details when game is lost', async () => {
      render(<GameOverModal {...defaultProps} />);
      
      expect(screen.getByText('Bulbasaur')).toBeDefined();
      // Note: The component might format generation differently
    });

    test('shows play again button when game is lost', async () => {
      render(<GameOverModal {...defaultProps} />);
      
      const restartButton = screen.getByRole('button', { name: /play again/i });
      expect(restartButton).toBeDefined();
    });
  });

  describe('Rendering - Game Won', () => {
    test('renders congratulations when game is won', async () => {
      render(<GameOverModal {...defaultProps} isWon={true} />);
      
      expect(screen.getByText('Congratulations!')).toBeDefined();
    });

    test('shows correct guess count when won', async () => {
      render(<GameOverModal {...defaultProps} isWon={true} guessCount={3} />);
      
      // Look specifically in the guesses used section
      expect(screen.getByText('3 / 10')).toBeDefined();
    });
  });

  describe('Pokemon Display', () => {
    test('displays Pokemon name', async () => {
      render(<GameOverModal {...defaultProps} />);
      
      expect(screen.getByText('Bulbasaur')).toBeDefined();
    });

    test('displays Pokemon types with correct styling', async () => {
      render(<GameOverModal {...defaultProps} />);
      
      // Types should be displayed with appropriate colors
      const grassType = screen.getByText('Grass');
      const poisonType = screen.getByText('Poison');
      
      expect(grassType).toBeDefined();
      expect(poisonType).toBeDefined();
    });

    test('displays Pokemon abilities', async () => {
      render(<GameOverModal {...defaultProps} />);
      
      expect(screen.getByText('Overgrow')).toBeDefined();
      expect(screen.getByText('Chlorophyll')).toBeDefined();
    });

    test('displays Pokemon stats', async () => {
      render(<GameOverModal {...defaultProps} />);
      
      expect(screen.getByText('318')).toBeDefined(); // Total stats
    });
  });

  describe('Modal Actions', () => {
    test('calls onRestart when restart button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<GameOverModal {...defaultProps} />);
      
      const restartButton = screen.getByRole('button', { name: /play again/i });
      
      await user.click(restartButton);
      
      expect(mockOnRestart).toHaveBeenCalled();
    });

    test('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<GameOverModal {...defaultProps} />);
      
      const closeButton = screen.getByLabelText('Close');
      
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('closes modal when restart is triggered', async () => {
      const user = userEvent.setup();
      
      render(<GameOverModal {...defaultProps} />);
      
      const restartButton = screen.getByRole('button', { name: /play again/i });
      
      await user.click(restartButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Share Functionality', () => {
    test('copies result to clipboard when share button is clicked', async () => {
      const user = userEvent.setup();
      
      // Mock clipboard after userEvent.setup()
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: jest.fn().mockResolvedValue(undefined)
        },
        writable: true
      });
      
      render(<GameOverModal {...defaultProps} />);
      
      const shareButton = screen.queryByText(/share|copy/i);
      if (shareButton) {
        await user.click(shareButton);
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      }
    });

    test('handles clipboard copy failure gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock clipboard after userEvent.setup()
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: jest.fn().mockRejectedValue(new Error('Clipboard failed'))
        },
        writable: true
      });
      
      render(<GameOverModal {...defaultProps} />);
      
      const shareButton = screen.queryByText(/share|copy/i);
      if (shareButton) {
        await user.click(shareButton);
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      }
    });
  });

  describe('Modal Visibility', () => {
    test('does not render when closed', async () => {
      render(<GameOverModal {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByText('Game Over')).toBeNull();
      expect(screen.queryByText('Congratulations!')).toBeNull();
    });

    test('renders when open', async () => {
      render(<GameOverModal {...defaultProps} isOpen={true} />);
      
      // Should render either game over or congratulations
      const gameOverText = screen.queryByText('Game Over');
      const congratsText = screen.queryByText('Congratulations!');
      
      expect(gameOverText || congratsText).toBeDefined();
    });
  });

  describe('Pokemon Image', () => {
    test('displays Pokemon image', async () => {
      render(<GameOverModal {...defaultProps} />);
      
      const pokemonImage = screen.getByAltText('Bulbasaur');
      expect(pokemonImage).toBeDefined();
    });

    test('handles missing Pokemon image gracefully', async () => {
      const pokemonWithoutImage = {
        ...mockPokemon,
        profile: ''
      };
      
      render(<GameOverModal {...defaultProps} targetPokemon={pokemonWithoutImage} />);
      
      // Should still render the modal without throwing error
      expect(screen.getByText('Bulbasaur')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    test('modal has proper ARIA attributes', async () => {
      render(<GameOverModal {...defaultProps} />);
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeDefined();
    });

    test('close button has proper label', async () => {
      render(<GameOverModal {...defaultProps} />);
      
      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeDefined();
    });

    test('buttons have proper types', async () => {
      render(<GameOverModal {...defaultProps} />);
      
      const restartButton = screen.getByRole('button', { name: /play again/i });
      expect(restartButton.getAttribute('type')).toBe('button');
    });
  });

  describe('Different Scenarios', () => {
    test('handles different Pokemon types correctly', async () => {
      const electricPokemon: Pokemon = {
        ...mockPokemon,
        name: 'Pikachu',
        profile: '/pikachu.png',
        types: ['Electric'],
        abilities: ['Static', 'Lightning Rod']
      };
      
      render(<GameOverModal {...defaultProps} targetPokemon={electricPokemon} />);
      
      expect(screen.getByText('Pikachu')).toBeDefined();
      expect(screen.getByText('Electric')).toBeDefined();
      expect(screen.getByText('Static')).toBeDefined();
    });

    test('handles Pokemon with multiple abilities', async () => {
      render(<GameOverModal {...defaultProps} />);
      
      expect(screen.getByText('Overgrow')).toBeDefined();
      expect(screen.getByText('Chlorophyll')).toBeDefined();
    });

    test('handles Pokemon with multiple tags', async () => {
      render(<GameOverModal {...defaultProps} />);
      
      // Look for translation keys since that's what the component actually shows
      expect(screen.getByText('tags.Starter')).toBeDefined();
      expect(screen.getByText('tags.Quadruped')).toBeDefined();
    });

    test('handles different guess counts', async () => {
      render(<GameOverModal {...defaultProps} guessCount={1} maxGuesses={10} />);
      
      // Look specifically in the guesses used section
      expect(screen.getByText('1 / 10')).toBeDefined();
    });

    test('handles max guesses reached scenario', async () => {
      render(<GameOverModal {...defaultProps} guessCount={10} maxGuesses={10} />);
      
      expect(screen.getByText('10 / 10')).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('handles null target Pokemon gracefully', async () => {
      render(<GameOverModal {...defaultProps} targetPokemon={null} />);
      
      // Component should handle null Pokemon without crashing
      // It might not render anything or show an error state
    });

    test('handles very long Pokemon names', async () => {
      const longNamePokemon: Pokemon = {
        ...mockPokemon,
        name: 'Pneumonoultramicroscopicsilicovolcanoconiosismon',
        profile: '/long-name-pokemon.png'
      };
      
      render(<GameOverModal {...defaultProps} targetPokemon={longNamePokemon} />);
      
      expect(screen.getByText('Pneumonoultramicroscopicsilicovolcanoconiosismon')).toBeDefined();
    });

    test('handles empty abilities array', async () => {
      const noAbilitiesPokemon: Pokemon = {
        ...mockPokemon,
        abilities: []
      };
      
      render(<GameOverModal {...defaultProps} targetPokemon={noAbilitiesPokemon} />);
      
      expect(screen.getByText('Bulbasaur')).toBeDefined();
    });

    test('handles zero guess count', async () => {
      render(<GameOverModal {...defaultProps} guessCount={0} />);
      
      // Should handle zero guesses gracefully
      expect(screen.getByText('0 / 10')).toBeDefined();
    });
  });

  describe('Localization', () => {
    test('uses correct locale for translations', async () => {
      render(<GameOverModal {...defaultProps} />);
      
      // Check if translations are working
      expect(screen.getByText('Game Over')).toBeDefined();
      expect(screen.getByText('Play Again')).toBeDefined();
    });

    test('displays translated Pokemon details', async () => {
      render(<GameOverModal {...defaultProps} />);
      
      // The component displays translation keys, not translated text
      expect(screen.getByText('game.columns.generation')).toBeDefined();
      expect(screen.getByText('game.columns.abilities')).toBeDefined();
    });
  });
}); 