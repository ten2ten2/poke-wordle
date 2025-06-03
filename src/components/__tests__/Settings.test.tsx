/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Settings from '../Settings';
import { GameSettings } from '@/types/pokemon';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      'settings.title': 'Settings',
      'settings.guessOrder': 'Guess Order',
      'settings.reverseOrder': 'Newest First',
      'settings.reverseOrderDesc': 'Show newest guesses at the top',
      'settings.normalOrder': 'Oldest First',
      'settings.normalOrderDesc': 'Show oldest guesses at the top',
      'settings.maxGuesses': 'Max Guesses',
      'settings.times': 'times',
      'settings.generationSelection': 'Generation Selection',
      'settings.selectAll': 'Select All',
      'settings.deselectAll': 'Deselect All',
      'settings.specialModes': 'Special Modes',
      'settings.pranksterMode': 'Prankster Mode',
      'settings.pranksterModeDesc': 'Hide one random attribute each guess',
      'settings.genArrow': 'Generation Arrow Mode',
      'settings.genArrowDesc': 'Show arrows for generation hints',
      'generation.Gen1': 'Gen 1',
      'generation.Gen2': 'Gen 2',
      'generation.Gen3': 'Gen 3',
      'generation.Gen4': 'Gen 4',
      'generation.Gen5': 'Gen 5',
      'generation.Gen6': 'Gen 6',
      'generation.Gen7': 'Gen 7',
      'generation.Gen8': 'Gen 8',
      'generation.Gen9': 'Gen 9',
      'common.close': 'Close',
      'common.save': 'Save',
      'common.cancel': 'Cancel'
    };
    return translations[key] || key;
  })
}));

const defaultSettings: GameSettings = {
  maxGuesses: 10,
  selectedGenerations: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  isPrankster: false,
  isGenArrow: false,
  guessOrder: 'reverse'
};

const mockOnClose = jest.fn();
const mockOnSettingsChange = jest.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  onSettingsChange: mockOnSettingsChange,
  currentSettings: defaultSettings
};

describe('Settings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders settings modal when open', async () => {
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Guess Order')).toBeInTheDocument();
      expect(screen.getByText('Max Guesses (10 times)')).toBeInTheDocument();
      expect(screen.getByText('Generation Selection')).toBeInTheDocument();
    });

    test('does not render when closed', async () => {
      await act(async () => {
        render(<Settings {...defaultProps} isOpen={false} />);
      });
      
      expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });

    test('renders close button', async () => {
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      const closeButton = screen.getAllByLabelText('Close')[0];
      expect(closeButton).toBeInTheDocument();
    });

    test('renders save and cancel buttons', async () => {
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Guess Order Settings', () => {
    test('shows current guess order selection', async () => {
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      const reverseButton = screen.getByText('Newest First').closest('button');
      const normalButton = screen.getByText('Oldest First').closest('button');
      
      expect(reverseButton).toHaveClass('bg-blue-500'); // Selected
      expect(normalButton).toHaveClass('bg-white'); // Not selected
    });

    test('allows changing guess order', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      const normalButton = screen.getByText('Oldest First').closest('button');
      
      await act(async () => {
        await user.click(normalButton!);
      });
      
      expect(normalButton).toHaveClass('bg-blue-500'); // Now selected
    });

    test('shows normal order as selected when current setting is normal', async () => {
      const props = {
        ...defaultProps,
        currentSettings: { ...defaultSettings, guessOrder: 'normal' as const }
      };
      
      await act(async () => {
        render(<Settings {...props} />);
      });
      
      const normalButton = screen.getByText('Oldest First').closest('button');
      expect(normalButton).toHaveClass('bg-blue-500');
    });
  });

  describe('Max Guesses Settings', () => {
    test('shows current max guesses selection', async () => {
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      const currentGuessButton = screen.getByText('10').closest('button');
      expect(currentGuessButton).toHaveClass('bg-blue-500');
    });

    test('allows changing max guesses', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      const newGuessButton = screen.getByText('5').closest('button');
      
      await act(async () => {
        await user.click(newGuessButton!);
      });
      
      expect(newGuessButton).toHaveClass('bg-blue-500');
      expect(screen.getByText('Max Guesses (5 times)')).toBeInTheDocument();
    });

    test('renders all guess options', async () => {
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      const guessOptions = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
      guessOptions.forEach(option => {
        expect(screen.getByText(option.toString())).toBeInTheDocument();
      });
    });
  });

  describe('Generation Selection', () => {
    test('shows all generations as selected by default', async () => {
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      for (let gen = 1; gen <= 9; gen++) {
        const genButton = screen.getByText(`Gen ${gen}`).closest('button');
        expect(genButton).toHaveClass('bg-blue-500');
      }
    });

    test('allows toggling individual generations', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      const gen1Button = screen.getByText('Gen 1').closest('button');
      
      await act(async () => {
        await user.click(gen1Button!);
      });
      
      expect(gen1Button).toHaveClass('bg-white'); // Deselected
    });

    test('select all button selects all generations', async () => {
      const user = userEvent.setup();
      const props = {
        ...defaultProps,
        currentSettings: { ...defaultSettings, selectedGenerations: [1, 2] }
      };
      
      await act(async () => {
        render(<Settings {...props} />);
      });
      
      const selectAllButton = screen.getByText('Select All');
      
      await act(async () => {
        await user.click(selectAllButton);
      });
      
      for (let gen = 1; gen <= 9; gen++) {
        const genButton = screen.getByText(`Gen ${gen}`).closest('button');
        expect(genButton).toHaveClass('bg-blue-500');
      }
    });

    test('deselect all button deselects all generations', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      const deselectAllButton = screen.getByText('Deselect All');
      
      await act(async () => {
        await user.click(deselectAllButton);
      });
      
      for (let gen = 1; gen <= 9; gen++) {
        const genButton = screen.getByText(`Gen ${gen}`).closest('button');
        expect(genButton).toHaveClass('bg-white');
      }
    });
  });

  describe('Special Modes', () => {
    test('shows prankster mode toggle', async () => {
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      expect(screen.getByText('Prankster Mode')).toBeInTheDocument();
      expect(screen.getByText('Hide one random attribute each guess')).toBeInTheDocument();
    });

    test('shows generation arrow mode toggle', async () => {
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      expect(screen.getByText('Generation Arrow Mode')).toBeInTheDocument();
      expect(screen.getByText('Show arrows for generation hints')).toBeInTheDocument();
    });

    test('allows toggling prankster mode', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      const pranksterToggle = screen.getByRole('checkbox', { name: 'Prankster Mode' });
      expect(pranksterToggle).not.toBeChecked();
      
      await act(async () => {
        await user.click(pranksterToggle);
      });
      
      expect(pranksterToggle).toBeChecked();
    });

    test('allows toggling generation arrow mode', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      const genArrowToggle = screen.getByRole('checkbox', { name: 'Generation Arrow Mode' });
      expect(genArrowToggle).not.toBeChecked();
      
      await act(async () => {
        await user.click(genArrowToggle);
      });
      
      expect(genArrowToggle).toBeChecked();
    });

    test('shows toggles as checked when modes are enabled', async () => {
      const props = {
        ...defaultProps,
        currentSettings: { ...defaultSettings, isPrankster: true, isGenArrow: true }
      };
      
      await act(async () => {
        render(<Settings {...props} />);
      });
      
      const pranksterToggle = screen.getByRole('checkbox', { name: 'Prankster Mode' });
      const genArrowToggle = screen.getByRole('checkbox', { name: 'Generation Arrow Mode' });
      
      expect(pranksterToggle).toBeChecked();
      expect(genArrowToggle).toBeChecked();
    });
  });

  describe('Modal Actions', () => {
    test('saves settings and closes modal when save is clicked', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      // Don't change settings - just test save functionality with current settings
      const saveButton = screen.getByText('Save');
      
      await act(async () => {
        await user.click(saveButton);
      });
      
      expect(mockOnSettingsChange).toHaveBeenCalledWith(defaultSettings);
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('cancels changes and closes modal when cancel is clicked', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      const cancelButton = screen.getByText('Cancel');
      
      await act(async () => {
        await user.click(cancelButton);
      });
      
      expect(mockOnSettingsChange).not.toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('cancels changes and closes modal when close button is clicked', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      // Find the actual close button element (button with aria-label="Close")
      const closeButton = screen.getByRole('button', { name: 'Close' });
      
      await act(async () => {
        await user.click(closeButton);
      });
      
      expect(mockOnSettingsChange).not.toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('resets local settings when modal is reopened', async () => {
      let result;
      
      await act(async () => {
        result = render(<Settings {...defaultProps} isOpen={false} />);
      });
      
      // Reopen with different settings
      const newSettings = { ...defaultSettings, maxGuesses: 5 };
      
      await act(async () => {
        result!.rerender(<Settings {...defaultProps} currentSettings={newSettings} isOpen={true} />);
      });
      
      expect(screen.getByText('Max Guesses (5 times)')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('modal has proper ARIA attributes', async () => {
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      
      const title = screen.getByRole('heading', { name: 'Settings' });
      expect(title).toBeInTheDocument();
    });

    test('fieldsets have proper legends', async () => {
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      expect(screen.getByText('Guess Order')).toBeInTheDocument();
      expect(screen.getByText('Max Guesses (10 times)')).toBeInTheDocument();
      expect(screen.getByText('Generation Selection')).toBeInTheDocument();
    });

    test('buttons have proper labels and roles', async () => {
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      const closeButton = screen.getByRole('button', { name: 'Close' });
      expect(closeButton).toHaveAttribute('type', 'button');
      
      const saveButton = screen.getByText('Save');
      expect(saveButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Keyboard Navigation', () => {
    test('can navigate and select options with keyboard', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      const gen1Button = screen.getByText('Gen 1').closest('button');
      
      // Focus and activate with keyboard
      gen1Button?.focus();
      
      await act(async () => {
        await user.keyboard(' '); // Space key
      });
      
      expect(gen1Button).toHaveClass('bg-white'); // Deselected
    });

    test('supports Enter key for button activation', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      const saveButton = screen.getByText('Save');
      saveButton.focus();
      
      await act(async () => {
        await user.keyboard('{Enter}');
      });
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('maintains settings state during user interaction', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<Settings {...defaultProps} />);
      });
      
      // Make multiple changes
      const normalOrderButton = screen.getByText('Oldest First').closest('button');
      const guess5Button = screen.getByText('5').closest('button');
      const pranksterToggle = screen.getByRole('checkbox', { name: 'Prankster Mode' });
      
      await act(async () => {
        await user.click(normalOrderButton!);
        await user.click(guess5Button!);
        await user.click(pranksterToggle);
      });
      
      // Verify all changes are maintained
      expect(normalOrderButton).toHaveClass('bg-blue-500');
      expect(screen.getByText('Max Guesses (5 times)')).toBeInTheDocument();
      expect(pranksterToggle).toBeChecked();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty generation selection', async () => {
      // Start with a props that already has empty selection to avoid the disabled save button
      const propsWithEmptySelection = {
        ...defaultProps,
        currentSettings: { ...defaultSettings, selectedGenerations: [] }
      };
      
      await act(async () => {
        render(<Settings {...propsWithEmptySelection} />);
      });
      
      const saveButton = screen.getByText('Save');
      expect(saveButton).toBeDisabled();
      
      // We can't click the save button when it's disabled, so just verify the state
      expect(mockOnSettingsChange).not.toHaveBeenCalled();
    });
  });
}); 