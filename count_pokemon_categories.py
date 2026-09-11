#!/usr/bin/env python3
import json

def count_pokemon_categories(json_file):
    """Count Pokemon by different categories based on their tags."""
    
    with open(json_file, 'r') as f:
        pokemon_data = json.load(f)
    
    # Initialize counters
    categories = {
        'starter': 0,
        'has-gmax': 0,
        'has-mega': 0,
        'late': 0,
        'legendary': 0,
        'fossil': 0,
        'mythical': 0,
        'paradox': 0,
        'ultra-beast': 0  # We'll check for this even though we didn't find it
    }
    
    # Count Pokemon with beast-boost ability (likely Ultra Beasts)
    beast_boost_count = 0
    
    # Track unique Pokemon names to avoid counting duplicates
    unique_pokemon = {}
    
    for pokemon in pokemon_data:
        name = pokemon.get('name', '')
        tags = pokemon.get('tags', [])
        abilities = pokemon.get('abilities', [])
        
        # Skip if tags is None
        if tags is None:
            tags = []
        
        # Count each category
        for category in categories:
            if category in tags:
                categories[category] += 1
        
        # Check for Ultra Beasts (Pokemon with beast-boost ability)
        if 'beast-boost' in abilities:
            beast_boost_count += 1
        
        # Store unique Pokemon info for analysis
        if name not in unique_pokemon:
            unique_pokemon[name] = {
                'tags': tags,
                'abilities': abilities,
                'id': pokemon.get('id', 0)
            }
    
    return categories, beast_boost_count, len(unique_pokemon)

def main():
    json_file = 'output/pokemon_data.json'
    
    try:
        categories, beast_boost_count, total_unique = count_pokemon_categories(json_file)
        
        print("Pokemon Category Counts:")
        print("=" * 40)
        print(f"Starter Pokemon: {categories['starter']}")
        print(f"Has Gigantamax: {categories['has-gmax']}")
        print(f"Has Mega Evolution: {categories['has-mega']}")
        print(f"Late Pokemon: {categories['late']}")
        print(f"Legendary Pokemon: {categories['legendary']}")
        print(f"Fossil Pokemon: {categories['fossil']}")
        print(f"Mythical Pokemon: {categories['mythical']}")
        print(f"Paradox Pokemon: {categories['paradox']}")
        print(f"Ultra Beast (explicit tag): {categories['ultra-beast']}")
        print(f"Ultra Beast (beast-boost ability): {beast_boost_count}")
        print("=" * 40)
        print(f"Total unique Pokemon: {total_unique}")
        
    except FileNotFoundError:
        print(f"Error: Could not find {json_file}")
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in {json_file}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main() 