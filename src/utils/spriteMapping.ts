// src/utils/spriteMapping.ts
import { SpeciesId } from '../data/species';

// Import all sprites needed
import spiderImg from '../assets/sprites/jumping-spider.png';
import mushroomImg from '../assets/sprites/puffball.png';
import dragonflyImg from '../assets/sprites/dragonfly.png';
import rockfishImg from '../assets/sprites/rockfish.png';
// Add imports for future sprites here...

// Define the map
const spriteMap: Record<SpeciesId, string> = {
    jumpingSpider: spiderImg,
    puffballMushroom: mushroomImg,
    dragonfly: dragonflyImg,
    rockfish: rockfishImg,
    // Add entries for future species here...
};

// Default/fallback sprite if ID not found
const fallbackSprite = spiderImg; // Or a specific placeholder image

/**
 * Gets the sprite image source for a given SpeciesId.
 * @param speciesId The ID of the species.
 * @returns The imported sprite string or a fallback.
 */
export function getSpriteForSpecies(speciesId: SpeciesId | undefined): string {
    if (!speciesId) return fallbackSprite;
    return spriteMap[speciesId] || fallbackSprite;
}