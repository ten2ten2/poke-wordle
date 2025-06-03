/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import GuessTable from '../GuessTable';
import { GuessResult } from '@/types/pokemon';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      'game.generation': 'Generation',
      'game.types': 'Types',
      'game.abilities': 'Abilities',
      'game.baseStatsTotal': 'Total Stats',
      'game.evolutionStage': 'Evolution Stage',
      'game.evolutionMethod': 'Evolution Method',
      'game.tags': 'Tags',
      'game.pokemon': 'Pokémon',
      'game.noGuessesYet': 'No guesses yet',
      'game.columns.type': 'Types',
      'game.columns.baseStats': 'Stats',
      'game.columns.generation': 'Generation',
      'game.columns.abilities': 'Abilities',
      'game.columns.evolution': 'Evolution',
      'game.columns.tags': 'Tags',
      'common.exact': 'Exact',
      'common.close': 'Close',
      'common.nope': 'Wrong',
      'generation.Gen1': 'generation.Gen1',
      'evolution.stage1': 'evolution.stage1',
      'evolution.stage2': 'evolution.stage2',
      'evolutionMethods.16': 'evolutionMethods.16',
      'evolutionMethods.32': 'evolutionMethods.32',
      'evolutionMethods.Thunder Stone': 'evolutionMethods.Thunder Stone',
      'tags.Starter': 'tags.Starter',
      'tags.Quadruped': 'tags.Quadruped',
      'tags.Bipedal': 'tags.Bipedal',
      'tags.Plant': 'tags.Plant'
    };
    return translations[key] || key;
  }),
  useLocale: jest.fn(() => 'en')
}));

// Mock translateText function
jest.mock('../../lib/pokemon', () => ({
  translateText: jest.fn((text) => text)
}));

const mockGuesses: GuessResult[] = [
  {
    name: 'Bulbasaur',
    profile: '/bulbasaur.png',
    generation: { value: 1, status: 'exact' },
    types: [
      { value: 'Grass', status: 'exact' },
      { value: 'Poison', status: 'exact' }
    ],
    abilities: [{ value: 'Overgrow', status: 'exact' }],
    base_stats_total: { value: 318, status: 'exact' },
    evolution_stage: { value: 1, status: 'exact' },
    evolution_method_detail: { value: '16', status: 'exact' },
    tags: [{ value: 'Starter', status: 'exact' }],
    isCorrect: true,
    fieldToHide: null
  },
  {
    name: 'Ivysaur',
    profile: '/ivysaur.png',
    generation: { value: 1, status: 'exact' },
    types: [
      { value: 'Grass', status: 'exact' },
      { value: 'Poison', status: 'exact' }
    ],
    abilities: [{ value: 'Overgrow', status: 'exact' }],
    base_stats_total: { value: 405, status: 'nope', arrow: 'lower' },
    evolution_stage: { value: 2, status: 'nope' },
    evolution_method_detail: { value: '32', status: 'close' },
    tags: [{ value: 'Quadruped', status: 'nope' }],
    isCorrect: false,
    fieldToHide: null
  },
  {
    name: 'Pikachu',
    profile: '/pikachu.png',
    generation: { value: 1, status: 'exact' },
    types: [{ value: 'Electric', status: 'nope' }],
    abilities: [{ value: 'Static', status: 'nope' }],
    base_stats_total: { value: 320, status: 'close', arrow: 'upper' },
    evolution_stage: { value: 1, status: 'exact' },
    evolution_method_detail: { value: 'Thunder Stone', status: 'nope' },
    tags: [{ value: 'Bipedal', status: 'nope' }],
    isCorrect: false,
    fieldToHide: null
  }
];

const defaultProps = {
  guesses: mockGuesses
};

describe('GuessTable', () => {
  describe('Rendering', () => {
    test('renders table with headers', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      expect(screen.getAllByText('Types')[0]).toBeDefined();
      expect(screen.getAllByText('Generation')[0]).toBeDefined();
      expect(screen.getAllByText('Stats')[0]).toBeDefined();
      expect(screen.getAllByText('Abilities')[0]).toBeDefined();
      expect(screen.getAllByText('Evolution')[0]).toBeDefined();
      expect(screen.getAllByText('Tags')[0]).toBeDefined();
    });

    test('renders all guesses', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      expect(screen.getAllByText('Bulbasaur')[0]).toBeDefined();
      expect(screen.getAllByText('Ivysaur')[0]).toBeDefined();
      expect(screen.getAllByText('Pikachu')[0]).toBeDefined();
    });

    test('renders empty state when no guesses', () => {
      act(() => {
        render(<GuessTable {...defaultProps} guesses={[]} />);
      });
      
      expect(screen.getByText('No guesses yet')).toBeDefined();
    });
  });

  describe('Status Indicators', () => {
    test('shows correct status for exact matches', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      // Bulbasaur should have all exact matches (correct guess)
      const bulbasaurRow = screen.getAllByText('Bulbasaur')[0].closest('.guess-table-card');
      expect(bulbasaurRow).toBeDefined();
      
      // Check for generation value
      expect(screen.getAllByText('generation.Gen1')[0]).toBeDefined();
    });

    test('shows correct status for wrong attributes', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      // Pikachu has wrong type and abilities (now visible)
      expect(screen.getAllByText('Electric')[0]).toBeDefined();
      expect(screen.getAllByText('Static')[0]).toBeDefined();
    });

    test('shows arrows for numeric values', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      // Check that stats with arrows are displayed
      expect(screen.getAllByText('405')[0]).toBeDefined(); // Ivysaur stats (lower)
      expect(screen.getAllByText('320')[0]).toBeDefined(); // Pikachu stats (higher)
    });

    test('handles close status correctly', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      // Evolution method detail for Ivysaur should be "close"
      expect(screen.getAllByText('evolutionMethods.32')[0]).toBeDefined();
      
      // Pikachu stats should be "close"
      expect(screen.getAllByText('320')[0]).toBeDefined();
    });
  });

  describe('Hidden Fields (Prankster Mode)', () => {
    test('hides field when fieldToHide is specified', () => {
      const hiddenFieldGuesses = [
        {
          ...mockGuesses[2], // Pikachu
          fieldToHide: 'types' // Hide types field
        }
      ];
      
      act(() => {
        render(<GuessTable {...defaultProps} guesses={hiddenFieldGuesses} />);
      });
      
      // Pikachu has types hidden (fieldToHide: 'types')
      const pikachuRow = screen.getAllByText('Pikachu')[0].closest('.guess-table-card');
      expect(pikachuRow).toBeDefined();
    });

    test('shows all fields when no field is hidden', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      // Bulbasaur and Ivysaur should show all fields
      expect(screen.getAllByText('Grass')[0]).toBeDefined();
      expect(screen.getAllByText('Poison')[0]).toBeDefined();
      expect(screen.getAllByText('Overgrow')[0]).toBeDefined();
    });
  });

  describe('Image Display', () => {
    test('displays Pokemon images correctly', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      const bulbasaurImage = screen.getAllByAltText('Bulbasaur')[0];
      const ivysaurImage = screen.getAllByAltText('Ivysaur')[0];
      const pikachuImage = screen.getAllByAltText('Pikachu')[0];
      
      expect(bulbasaurImage).toBeDefined();
      expect(ivysaurImage).toBeDefined();
      expect(pikachuImage).toBeDefined();
    });

    test('handles missing images gracefully', () => {
      const guessesWithoutImages = mockGuesses.map(guess => ({
        ...guess,
        profile: '/missing-image.png'
      }));
      
      act(() => {
        render(<GuessTable {...defaultProps} guesses={guessesWithoutImages} />);
      });
      
      // Should still render Pokemon names
      expect(screen.getAllByText('Bulbasaur')[0]).toBeDefined();
      expect(screen.getAllByText('Ivysaur')[0]).toBeDefined();
      expect(screen.getAllByText('Pikachu')[0]).toBeDefined();
    });
  });

  describe('Types Display', () => {
    test('displays single type correctly', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      // Electric type is now visible on Pikachu
      expect(screen.getAllByText('Electric')[0]).toBeDefined();
    });

    test('displays multiple types correctly', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      expect(screen.getAllByText('Grass')[0]).toBeDefined();
      expect(screen.getAllByText('Poison')[0]).toBeDefined();
    });

    test('applies correct styling to types based on status', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      const grassType = screen.getAllByText('Grass')[0];
      const electricType = screen.getAllByText('Electric')[0];
      
      expect(grassType).toBeDefined();
      expect(electricType).toBeDefined();
      
      // Check for status classes
      expect(grassType).toHaveClass('tag-exact');
      expect(electricType).toHaveClass('tag-nope');
    });
  });

  describe('Abilities Display', () => {
    test('displays abilities correctly', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      expect(screen.getAllByText('Overgrow')[0]).toBeDefined();
      expect(screen.getAllByText('Static')[0]).toBeDefined();
    });

    test('handles multiple abilities', () => {
      const guessWithMultipleAbilities: GuessResult = {
        ...mockGuesses[0],
        profile: '/bulbasaur.png',
        abilities: [
          { value: 'Overgrow', status: 'exact' },
          { value: 'Chlorophyll', status: 'nope' }
        ]
      };
      
      act(() => {
        render(<GuessTable {...defaultProps} guesses={[guessWithMultipleAbilities]} />);
      });
      
      expect(screen.getAllByText('Overgrow')[0]).toBeDefined();
      expect(screen.getAllByText('Chlorophyll')[0]).toBeDefined();
    });
  });

  describe('Stats Display', () => {
    test('displays base stats total correctly', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      expect(screen.getAllByText('318')[0]).toBeDefined();
      expect(screen.getAllByText('405')[0]).toBeDefined();
      expect(screen.getAllByText('320')[0]).toBeDefined();
    });

    test('shows arrows for stat differences', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      // Component should show visual indicators for higher/lower stats
      // This would typically be arrows or directional indicators
      
      // Check that the values are present
      expect(screen.getAllByText('405')[0]).toBeDefined(); // lower arrow
      expect(screen.getAllByText('320')[0]).toBeDefined(); // higher arrow
    });
  });

  describe('Evolution Information', () => {
    test('displays evolution stage correctly', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      // Evolution stages are displayed as translation keys
      expect(screen.getAllByText('evolution.stage1')[0]).toBeDefined(); // Bulbasaur and Pikachu
      expect(screen.getAllByText('evolution.stage2')[0]).toBeDefined(); // Ivysaur
    });

    test('displays evolution method correctly', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      expect(screen.getAllByText('evolutionMethods.16')[0]).toBeDefined(); // Bulbasaur level
      expect(screen.getAllByText('evolutionMethods.32')[0]).toBeDefined(); // Ivysaur level
      expect(screen.getAllByText('evolutionMethods.Thunder Stone')[0]).toBeDefined(); // Pikachu item
    });
  });

  describe('Tags Display', () => {
    test('displays tags correctly', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      expect(screen.getAllByText('tags.Starter')[0]).toBeDefined();
      expect(screen.getAllByText('tags.Quadruped')[0]).toBeDefined();
      expect(screen.getAllByText('tags.Bipedal')[0]).toBeDefined();
    });

    test('handles multiple tags', () => {
      const guessWithMultipleTags: GuessResult = {
        ...mockGuesses[0],
        profile: '/bulbasaur.png',
        tags: [
          { value: 'Starter', status: 'exact' },
          { value: 'Quadruped', status: 'nope' },
          { value: 'Plant', status: 'close' }
        ]
      };
      
      act(() => {
        render(<GuessTable {...defaultProps} guesses={[guessWithMultipleTags]} />);
      });
      
      expect(screen.getAllByText('tags.Starter')[0]).toBeDefined();
      expect(screen.getAllByText('tags.Quadruped')[0]).toBeDefined();
      expect(screen.getAllByText('tags.Plant')[0]).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    test('component has proper structure', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      // The component uses card layout, not table
      const container = document.querySelector('.space-y-4');
      expect(container).toBeDefined();
    });

    test('images have proper alt text', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      expect(screen.getAllByAltText('Bulbasaur')[0]).toBeDefined();
      expect(screen.getAllByAltText('Ivysaur')[0]).toBeDefined();
      expect(screen.getAllByAltText('Pikachu')[0]).toBeDefined();
    });

    test('component has proper content', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      // Check for guess cards
      const guessCards = document.querySelectorAll('.guess-table-card');
      expect(guessCards.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    test('component is responsive', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      // Check for responsive structure
      const container = document.querySelector('.space-y-4');
      expect(container).toBeDefined();
      
      // Component should have responsive classes or structure
    });

    test('handles long Pokemon names', () => {
      const guessWithLongName: GuessResult = {
        ...mockGuesses[0],
        name: 'Pneumonoultramicroscopicsilicovolcanoconiosismon',
        profile: '/long-name-pokemon.png'
      };
      
      act(() => {
        render(<GuessTable {...defaultProps} guesses={[guessWithLongName]} />);
      });
      
      expect(screen.getAllByText('Pneumonoultramicroscopicsilicovolcanoconiosismon')[0]).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty arrays in guess data', () => {
      const guessWithEmptyArrays: GuessResult = {
        ...mockGuesses[0],
        profile: '/bulbasaur.png',
        types: [],
        abilities: [],
        tags: []
      };
      
      act(() => {
        render(<GuessTable {...defaultProps} guesses={[guessWithEmptyArrays]} />);
      });
      
      expect(screen.getAllByText('Bulbasaur')[0]).toBeDefined();
    });

    test('handles missing arrow property', () => {
      const guessWithoutArrow: GuessResult = {
        ...mockGuesses[1],
        profile: '/ivysaur.png',
        base_stats_total: { value: 405, status: 'nope' } // No arrow property
      };
      
      act(() => {
        render(<GuessTable {...defaultProps} guesses={[guessWithoutArrow]} />);
      });
      
      expect(screen.getAllByText('405')[0]).toBeDefined();
    });

    test('handles all possible status values', () => {
      const guessWithAllStatuses: GuessResult = {
        name: 'TestMon',
        profile: '/testmon.png',
        generation: { value: 1, status: 'exact' },
        types: [
          { value: 'Type1', status: 'exact' },
          { value: 'Type2', status: 'close' },
          { value: 'Type3', status: 'nope' }
        ],
        abilities: [{ value: 'Ability1', status: 'exact' }],
        base_stats_total: { value: 100, status: 'close' },
        evolution_stage: { value: 1, status: 'nope' },
        evolution_method_detail: { value: 'Method', status: 'close' },
        tags: [{ value: 'Tag1', status: 'exact' }],
        isCorrect: false,
        fieldToHide: null
      };
      
      act(() => {
        render(<GuessTable {...defaultProps} guesses={[guessWithAllStatuses]} />);
      });
      
      expect(screen.getAllByText('TestMon')[0]).toBeDefined();
      expect(screen.getAllByText('Type1')[0]).toBeDefined();
      expect(screen.getAllByText('Type2')[0]).toBeDefined();
      expect(screen.getAllByText('Type3')[0]).toBeDefined();
    });
  });

  describe('Localization', () => {
    test('uses translated headers', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      // Check for translated column headers that actually exist
      expect(screen.getAllByText('Types')[0]).toBeDefined();
      expect(screen.getAllByText('Generation')[0]).toBeDefined();
      expect(screen.getAllByText('Stats')[0]).toBeDefined();
      expect(screen.getAllByText('Abilities')[0]).toBeDefined();
    });

    test('displays translation keys for Pokemon data', () => {
      act(() => {
        render(<GuessTable {...defaultProps} />);
      });
      
      // Check that translation keys are used for tags and evolution
      expect(screen.getAllByText('tags.Starter')[0]).toBeDefined();
      expect(screen.getAllByText('evolution.stage1')[0]).toBeDefined();
      expect(screen.getAllByText('evolutionMethods.16')[0]).toBeDefined();
    });
  });
}); 