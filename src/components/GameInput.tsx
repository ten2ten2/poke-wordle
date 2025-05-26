'use client';

import { useState, useRef, useEffect } from 'react';
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
  gameOver 
}: GameInputProps) {
  const t = useTranslations();
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [shouldShowSuggestions, setShouldShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (input.length > 0 && shouldShowSuggestions) {
      const filtered = pokemonNames
        .filter(name => name.toLowerCase().indexOf(input.toLowerCase()) !== -1)
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else if (!shouldShowSuggestions) {
      setSuggestions([]);
      setShowSuggestions(false);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setSelectedIndex(-1);
  }, [input, pokemonNames, shouldShowSuggestions]);

  const handleSubmit = (name?: string) => {
    if (gameOver) return;
    
    const submittedName = name || input;
    if (submittedName.trim()) {
      onSubmit(submittedName.trim());
      setInput('');
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (gameOver) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        setInput(suggestions[selectedIndex]);
        setShouldShowSuggestions(false);
        setShowSuggestions(false);
        setSelectedIndex(-1);
        setSuggestions([]);
      } else {
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (gameOver) return;
    
    setInput(suggestion);
    setShouldShowSuggestions(false);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    setShouldShowSuggestions(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Input and Submit */}
      <div className="relative">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
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
                  setShowSuggestions(false);
                  setSuggestions([]);
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
            
            {showSuggestions && !gameOver && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 sm:max-h-80 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full text-left px-4 py-3 sm:py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors duration-150 ${
                      index === selectedIndex ? 'bg-blue-100' : ''
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
            className="btn-primary flex-shrink-0 min-w-[100px] sm:min-w-[120px]"
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
            onClick={onRandomStart}
            disabled={disabled || gameOver}
            className="btn-success flex-1 sm:flex-none min-w-[140px]"
          >
            <span className="text-responsive-sm">{t('game.randomStart')}</span>
          </button>
        )}
        
        {gameStarted && !gameOver && (
          <button
            onClick={onGiveUp}
            disabled={disabled}
            className="btn-danger flex-1 sm:flex-none min-w-[100px]"
          >
            <span className="text-responsive-sm">{t('game.giveUp')}</span>
          </button>
        )}
        
        <button
          onClick={onRestart}
          disabled={disabled}
          className="btn-secondary flex-1 sm:flex-none min-w-[100px]"
        >
          <span className="text-responsive-sm">{t('game.restart')}</span>
        </button>
      </div>
    </div>
  );
} 