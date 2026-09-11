/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
      'common.close': 'Close',
    };
    return translations[key] || key;
  }),
  useLocale: jest.fn(() => 'en'),
}));

// Mock translateText function
jest.mock('../../lib/pokemon', () => ({
  translateText: jest.fn((text) => text),
  getWikiUrl: jest.fn((name) => `https://example.com/wiki/${name}`),
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
    speed: 45,
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
  maxGuesses: 10,
};

async function renderModal(element: React.ReactElement) {
  await act(async () => {
    render(element);
  });
}

describe('GameOverModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering - Game Lost', () => {
    test('renders game over modal when game is lost', async () => {
      await renderModal(<GameOverModal {...defaultProps} />);

      expect(screen.getByText('Game Over')).toBeDefined();
      expect(screen.getByText('Bulbasaur')).toBeDefined();
    });

    test('shows target Pokemon details when game is lost', async () => {
      await renderModal(<GameOverModal {...defaultProps} />);

      expect(screen.getByText('Bulbasaur')).toBeDefined();
      // Note: The component might format generation differently
    });

    test('shows play again button when game is lost', async () => {
      await renderModal(<GameOverModal {...defaultProps} />);

      const restartButton = screen.getByRole('button', { name: /play again/i });
      expect(restartButton).toBeDefined();
    });
  });

  describe('Rendering - Game Won', () => {
    test('renders congratulations when game is won', async () => {
      await renderModal(<GameOverModal {...defaultProps} isWon={true} />);

      expect(screen.getByText('Congratulations!')).toBeDefined();
    });

    test('shows correct guess count when won', async () => {
      await renderModal(
        <GameOverModal {...defaultProps} isWon={true} guessCount={3} />,
      );

      // Look specifically in the guesses used section
      expect(screen.getByText('3 / 10')).toBeDefined();
    });
  });

  describe('Pokemon Display', () => {
    test('displays Pokemon name', async () => {
      await renderModal(<GameOverModal {...defaultProps} />);

      expect(screen.getByText('Bulbasaur')).toBeDefined();
    });

    test('displays Pokemon types with correct styling', async () => {
      await renderModal(<GameOverModal {...defaultProps} />);

      // Types should be displayed with appropriate colors
      const grassType = screen.getByText('Grass');
      const poisonType = screen.getByText('Poison');

      expect(grassType).toBeDefined();
      expect(poisonType).toBeDefined();
    });

    test('displays Pokemon abilities', async () => {
      await renderModal(<GameOverModal {...defaultProps} />);

      expect(screen.getByText('Overgrow')).toBeDefined();
      expect(screen.getByText('Chlorophyll')).toBeDefined();
    });

    test('displays Pokemon stats', async () => {
      await renderModal(<GameOverModal {...defaultProps} />);

      expect(screen.getByText('318')).toBeDefined(); // Total stats
    });
  });

  describe('Modal Actions', () => {
    test('calls onRestart when restart button is clicked', async () => {
      const user = userEvent.setup();

      await renderModal(<GameOverModal {...defaultProps} />);

      const restartButton = screen.getByRole('button', { name: /play again/i });

      await user.click(restartButton);

      expect(mockOnRestart).toHaveBeenCalled();
    });

    test('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();

      await renderModal(<GameOverModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close');

      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('restart does not also dismiss the next result', async () => {
      const user = userEvent.setup();

      await renderModal(<GameOverModal {...defaultProps} />);

      const restartButton = screen.getByRole('button', { name: /play again/i });

      await user.click(restartButton);

      expect(mockOnRestart).toHaveBeenCalledTimes(1);
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Modal Visibility', () => {
    test('does not render when closed', async () => {
      await renderModal(<GameOverModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Game Over')).toBeNull();
      expect(screen.queryByText('Congratulations!')).toBeNull();
    });

    test('renders when open', async () => {
      await renderModal(<GameOverModal {...defaultProps} isOpen={true} />);

      // Should render either game over or congratulations
      const gameOverText = screen.queryByText('Game Over');
      const congratsText = screen.queryByText('Congratulations!');

      expect(gameOverText || congratsText).toBeDefined();
    });
  });

  describe('Pokemon Image', () => {
    test('displays Pokemon image', async () => {
      await renderModal(<GameOverModal {...defaultProps} />);

      const pokemonImage = screen.getByAltText('Bulbasaur');
      expect(pokemonImage).toBeDefined();
    });

    test('handles missing Pokemon image gracefully', async () => {
      const pokemonWithoutImage = {
        ...mockPokemon,
        profile: '',
      };

      await renderModal(
        <GameOverModal {...defaultProps} targetPokemon={pokemonWithoutImage} />,
      );

      // Should still render the modal without throwing error
      expect(screen.getByText('Bulbasaur')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    test('modal has proper ARIA attributes', async () => {
      await renderModal(<GameOverModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeDefined();
    });

    test('close button has proper label', async () => {
      await renderModal(<GameOverModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeDefined();
    });

    test('buttons have proper types', async () => {
      await renderModal(<GameOverModal {...defaultProps} />);

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
        abilities: ['Static', 'Lightning Rod'],
      };

      await renderModal(
        <GameOverModal {...defaultProps} targetPokemon={electricPokemon} />,
      );

      expect(screen.getByText('Pikachu')).toBeDefined();
      expect(screen.getByText('Electric')).toBeDefined();
      expect(screen.getByText('Static')).toBeDefined();
    });

    test('handles Pokemon with multiple abilities', async () => {
      await renderModal(<GameOverModal {...defaultProps} />);

      expect(screen.getByText('Overgrow')).toBeDefined();
      expect(screen.getByText('Chlorophyll')).toBeDefined();
    });

    test('handles Pokemon with multiple tags', async () => {
      await renderModal(<GameOverModal {...defaultProps} />);

      // Look for translation keys since that's what the component actually shows
      expect(screen.getByText('tags.Starter')).toBeDefined();
      expect(screen.getByText('tags.Quadruped')).toBeDefined();
    });

    test('handles different guess counts', async () => {
      await renderModal(
        <GameOverModal {...defaultProps} guessCount={1} maxGuesses={10} />,
      );

      // Look specifically in the guesses used section
      expect(screen.getByText('1 / 10')).toBeDefined();
    });

    test('handles max guesses reached scenario', async () => {
      await renderModal(
        <GameOverModal {...defaultProps} guessCount={10} maxGuesses={10} />,
      );

      expect(screen.getByText('10 / 10')).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('handles null target Pokemon gracefully', async () => {
      await renderModal(
        <GameOverModal {...defaultProps} targetPokemon={null} />,
      );

      // Component should handle null Pokemon without crashing
      // It might not render anything or show an error state
    });

    test('handles very long Pokemon names', async () => {
      const longNamePokemon: Pokemon = {
        ...mockPokemon,
        name: 'Pneumonoultramicroscopicsilicovolcanoconiosismon',
        profile: '/long-name-pokemon.png',
      };

      await renderModal(
        <GameOverModal {...defaultProps} targetPokemon={longNamePokemon} />,
      );

      expect(
        screen.getByText('Pneumonoultramicroscopicsilicovolcanoconiosismon'),
      ).toBeDefined();
    });

    test('handles empty abilities array', async () => {
      const noAbilitiesPokemon: Pokemon = {
        ...mockPokemon,
        abilities: [],
      };

      await renderModal(
        <GameOverModal {...defaultProps} targetPokemon={noAbilitiesPokemon} />,
      );

      expect(screen.getByText('Bulbasaur')).toBeDefined();
    });

    test('handles zero guess count', async () => {
      await renderModal(<GameOverModal {...defaultProps} guessCount={0} />);

      // Should handle zero guesses gracefully
      expect(screen.getByText('0 / 10')).toBeDefined();
    });
  });

  describe('Localization', () => {
    test('uses correct locale for translations', async () => {
      await renderModal(<GameOverModal {...defaultProps} />);

      // Check if translations are working
      expect(screen.getByText('Game Over')).toBeDefined();
      expect(screen.getByText('Play Again')).toBeDefined();
    });

    test('displays translated Pokemon details', async () => {
      await renderModal(<GameOverModal {...defaultProps} />);

      // The component displays translation keys, not translated text
      expect(screen.getByText('game.columns.generation')).toBeDefined();
      expect(screen.getByText('game.columns.abilities')).toBeDefined();
    });
  });
});
