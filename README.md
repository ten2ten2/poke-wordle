# Poke Wordle

A Pokémon guessing game where you try to identify a Pokémon based on various clues including types, abilities, stats, evolution, and more!

## Features

- 🎮 **Interactive Gameplay**: Guess Pokémon based on multiple attributes
- 🌍 **Multi-language Support**: Available in 9 languages (EN, JA, ZH-Hans, ZH-Hant, KO, FR, DE, IT, ES)
- ⚙️ **Customizable Settings**: Adjust max guesses, generations, and game modes
- 🎭 **Prankster Mode**: Randomly hide one attribute per guess for extra challenge
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices
- 🎯 **Smart Hints**: Color-coded feedback and directional arrows for stats

## How to Play

1. Enter a Pokémon name in the input field
2. Each guess will show you how close your guess is to the target:
   - **Green**: Exact match
   - **Yellow**: Close match
   - **Gray**: No match
3. Use the clues to narrow down your guesses
4. Try to guess the Pokémon within the allowed number of attempts!

## Game Settings

- **Max Guesses**: Set the maximum number of attempts (3-15)
- **Generations**: Choose which Pokémon generations to include
- **Prankster Mode**: Randomly hide one attribute per guess
- **Generation Arrows**: Show directional hints for generation comparison
- **Guess Order**: Display guesses in normal or reverse order

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Internationalization**: next-intl
- **UI Components**: Headless UI, Heroicons
- **Deployment**: Vercel

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/poke-wordle.git
cd poke-wordle

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Project Structure

```
poke-wordle/
├── public/                          # Static assets
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── [locale]/               # Internationalized routes
│   │   └── api/                    # API routes
│   ├── components/                  # React components
│   ├── data/                       # Pokémon data files
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Utility functions
│   ├── messages/                   # Translation files
│   ├── styles/                     # Global styles
│   └── types/                      # TypeScript type definitions
├── next.config.ts                  # Next.js configuration
├── tailwind.config.js              # Tailwind CSS configuration
└── tsconfig.json                   # TypeScript configuration
```

## Data Sources

The Pokémon data includes information from all generations (1-9) with localized names and attributes in multiple languages.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Pokémon data sourced from various public APIs and databases
- Icons by Heroicons
- UI components by Headless UI
- Styling by Tailwind CSS 