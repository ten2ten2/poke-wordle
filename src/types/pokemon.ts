export interface Pokemon {
  id: number;
  pokedex_id_national: number;
  name: string;
  profile: string;
  generation: number;
  types: string[];
  abilities: string[];
  base_stats_total: number;
  base_stats: {
    attack: number;
    defense: number;
    hp: number;
    sp_attack: number;
    sp_defense: number;
    speed: number;
  };
  evolution_stage: number;
  evolution_method: string;
  evolution_method_detail: string;
  tags: string[] | null;
}

export type ComparisonStatus = 'exact' | 'close' | 'nope';

export interface GuessResult {
  name: string;
  profile: string;
  generation: {
    value: number;
    status: ComparisonStatus;
    arrow?: 'upper' | 'lower';
  };
  types: Array<{
    value: string;
    status: ComparisonStatus;
  }>;
  abilities: Array<{
    value: string;
    status: ComparisonStatus;
  }>;
  base_stats_total: {
    value: number;
    status: ComparisonStatus;
    arrow?: 'upper' | 'lower';
  };
  evolution_stage: {
    value: number | null;
    status: ComparisonStatus;
  };
  evolution_method_detail: {
    value: string | null;
    status: ComparisonStatus;
  };
  tags: Array<{
    value: string;
    status: ComparisonStatus;
  }>;
  isCorrect: boolean;
  fieldToHide: string | null;
  pranksterPokemonProfile?: string | null;
}

export interface GameSettings {
  maxGuesses: number;
  selectedGenerations: number[];
  isPrankster: boolean;
  isGenArrow: boolean;
  guessOrder: 'normal' | 'reverse';
}

export interface GameState {
  targetPokemon: Pokemon | null;
  guesses: GuessResult[];
  isGameOver: boolean;
  isWon: boolean;
  settings: GameSettings;
}
