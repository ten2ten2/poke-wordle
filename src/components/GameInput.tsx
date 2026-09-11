'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';

interface GameInputProps {
  pokemonNames: string[];
  onSubmit: (name: string) => void;
  onRandomStart: () => void;
  onGiveUp: () => void;
  onRestart: () => void;
  disabled: boolean;
  gameStarted: boolean;
  gameOver: boolean;
}

export default function GameInput({
  pokemonNames,
  onSubmit,
  onRandomStart,
  onGiveUp,
  onRestart,
  disabled,
  gameStarted,
  gameOver,
}: GameInputProps) {
  const t = useTranslations();
  const [input, setInput] = useState('');

  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [shouldShowSuggestions, setShouldShowSuggestions] = useState(false);
  const [debouncedInput, setDebouncedInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInput(input);
    }, 150);

    return () => clearTimeout(timer);
  }, [input]);

  // Memoize filtered suggestions to avoid recalculation on every render
  const suggestions = useMemo(() => {
    if (debouncedInput.length === 0 || !shouldShowSuggestions) {
      return [];
    }

    const lowercaseInput = debouncedInput.toLowerCase();
    return pokemonNames.filter((name) =>
      name.toLowerCase().includes(lowercaseInput),
    );
  }, [debouncedInput, pokemonNames, shouldShowSuggestions]);

  const showSuggestions = suggestions.length > 0 && shouldShowSuggestions;

  const handleSubmit = useCallback(
    (name?: string) => {
      if (gameOver || disabled) return;

      const submittedName = name || input;
      if (submittedName.trim()) {
        onSubmit(submittedName.trim());
        setInput('');
        setShouldShowSuggestions(false);
        setSelectedIndex(-1);
      }
    },
    [gameOver, disabled, input, onSubmit],
  );

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    setSelectedIndex(-1);
    setShouldShowSuggestions(value.length > 0);
  }, []);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (gameOver || disabled) return;

      setInput(suggestion);
      setShouldShowSuggestions(false);
      setSelectedIndex(-1);
      inputRef.current?.focus();
    },
    [gameOver, disabled],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          setInput(suggestions[selectedIndex]);
          setShouldShowSuggestions(false);
          setSelectedIndex(-1);
        } else {
          handleSubmit();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === 'Escape') {
        setShouldShowSuggestions(false);
        setSelectedIndex(-1);
      }
    },
    [selectedIndex, suggestions, handleSubmit],
  );

  const handleRandomStart = useCallback(() => {
    onRandomStart();
    setInput('');
    setShouldShowSuggestions(false);
    setSelectedIndex(-1);
  }, [onRandomStart]);

  const handleGiveUp = useCallback(() => {
    onGiveUp();
    setInput('');
    setShouldShowSuggestions(false);
    setSelectedIndex(-1);
  }, [onGiveUp]);

  const handleRestart = useCallback(() => {
    onRestart();
    setInput('');
    setShouldShowSuggestions(false);
    setSelectedIndex(-1);
  }, [onRestart]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Input and Submit */}
      <div className="relative">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              aria-label={t('game.inputPlaceholder')}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (input.length > 0) {
                  setShouldShowSuggestions(true);
                }
              }}
              onBlur={() => {
                // Delay hiding to allow click events on suggestions
                setTimeout(() => {
                  setShouldShowSuggestions(false);
                }, 150);
              }}
              placeholder={t('game.inputPlaceholder')}
              disabled={disabled || gameOver}
              className="input-primary text-base"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
            />

            {showSuggestions && !gameOver && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 sm:max-h-80 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full text-left px-4 py-3 sm:py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-hidden transition-colors duration-150 ${
                      index === selectedIndex ? 'bg-red-100' : ''
                    } ${index === 0 ? 'rounded-t-lg' : ''} ${index === suggestions.length - 1 ? 'rounded-b-lg' : ''}`}
                  >
                    <span className="text-responsive-sm">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => handleSubmit()}
            disabled={disabled || gameOver || !input.trim()}
            className="btn-primary shrink-0 min-w-[100px] sm:min-w-[120px]"
          >
            {disabled ? (
              <div className="flex items-center justify-center">
                <div className="loading-spinner w-4 h-4 mr-2"></div>
                <span className="mobile-hidden">{t('game.submitting')}</span>
              </div>
            ) : (
              t('game.submit')
            )}
          </button>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
        {!gameStarted && (
          <button
            onClick={handleRandomStart}
            disabled={disabled || gameOver}
            className="btn-success flex-1 sm:flex-none min-w-[140px]"
          >
            <span className="text-responsive-sm">{t('game.randomStart')}</span>
          </button>
        )}

        {gameStarted && !gameOver && (
          <button
            onClick={handleGiveUp}
            disabled={disabled}
            className="btn-danger flex-1 sm:flex-none min-w-[100px]"
          >
            <span className="text-responsive-sm">{t('game.giveUp')}</span>
          </button>
        )}

        <button
          onClick={handleRestart}
          disabled={disabled}
          className="btn-secondary flex-1 sm:flex-none min-w-[100px]"
        >
          <span className="text-responsive-sm">{t('game.restart')}</span>
        </button>
      </div>
    </div>
  );
}
