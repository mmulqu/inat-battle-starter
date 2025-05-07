// src/utils/animations.ts
import { SpeciesId } from '../data/species';

// Import sprite sheet assets
// IMPORTANT: Ensure these paths are correct relative to this animations.ts file
// AND that the actual image files exist at these locations.
import jumpingSpiderIdleSheet from '../assets/sprites/jumping_spider_idle_strip.png'; 
import jumpingSpiderAttackSheet from '../assets/sprites/jumping_spider_attack_strip.png';
import rockfishIdleSheet from '../assets/sprites/rockfish_idle_strip.png';
import rockfishAttackSheet from '../assets/sprites/rockfish_attack_strip.png';
import puffballIdleSheet from '../assets/sprites/puffball_idle_strip.png';
import puffballAttackSheet from '../assets/sprites/puffball_attack_strip.png';
import dragonflyIdleSheet from '../assets/sprites/dragonfly_idle_strip.png';
import dragonflyAttackSheet from '../assets/sprites/dragonfly_attack_strip.png';
// Add other imports as you create more sprite sheets

console.log("[DEBUG animations.ts] Imported jumpingSpiderIdleSheet URL:", jumpingSpiderIdleSheet);
console.log("[DEBUG animations.ts] Imported rockfishIdleSheet URL:", rockfishIdleSheet);
console.log("[DEBUG animations.ts] Imported puffballIdleSheet URL:", puffballIdleSheet);
console.log("[DEBUG animations.ts] Imported dragonflyIdleSheet URL:", dragonflyIdleSheet);

export interface AnimationFrameData {
  sheet: string; // This will now hold the processed URL from the import
  frames: number; // Total number of frames in this animation strip
  fps: number; // Target frames per second for this animation
  frameWidth: number; // Width of a single frame
  frameHeight: number; // Height of a single frame
  loop: boolean; // Whether the animation should loop
}

export interface SpeciesAnimationSet {
  idle: AnimationFrameData;
  attack?: AnimationFrameData; // Optional for now, can be expanded
  hurt?: AnimationFrameData;
  faint?: AnimationFrameData;
  // Add other animation types like 'specialAttack', 'defend' as needed
}

export const speciesAnimations: Partial<Record<SpeciesId, SpeciesAnimationSet>> = {
  jumpingSpider: {
    idle: {
      sheet: jumpingSpiderIdleSheet, // Use imported variable
      frames: 4, // Example: 4 frames for idle
      fps: 8,
      frameWidth: 256, // Corrected
      frameHeight: 256, // Corrected
      loop: true,
    },
    attack: {
      sheet: jumpingSpiderAttackSheet, // Use imported variable
      frames: 6, // Example: 6 frames for attack
      fps: 12,
      frameWidth: 256, // Corrected
      frameHeight: 256, // Corrected
      loop: false,
    },
  },
  rockfish: {
    idle: {
      sheet: rockfishIdleSheet, // Use imported variable
      frames: 3,
      fps: 6,
      frameWidth: 256, // Corrected
      frameHeight: 256, // Corrected
      loop: true,
    },
    attack: {
      sheet: rockfishAttackSheet, // Use imported variable
      frames: 5,
      fps: 10,
      frameWidth: 256, // Corrected
      frameHeight: 256, // Corrected
      loop: false,
    },
  },
  puffballMushroom: {
    idle: {
      sheet: puffballIdleSheet,
      frames: 3, fps: 7, 
      frameWidth: 256, // Corrected
      frameHeight: 256, // Corrected
      loop: true,
    },
    attack: {
      sheet: puffballAttackSheet,
      frames: 4, fps: 10, 
      frameWidth: 256, // Corrected
      frameHeight: 256, // Corrected
      loop: false,
    },
  },
  dragonfly: {
    idle: {
      sheet: dragonflyIdleSheet,
      frames: 4, fps: 12, 
      frameWidth: 256, // Corrected
      frameHeight: 256, // Corrected
      loop: true,
    },
    attack: {
      sheet: dragonflyAttackSheet,
      frames: 5, fps: 15, 
      frameWidth: 256, // Corrected
      frameHeight: 256, // Corrected
      loop: false,
    },
  },
  // Add other species here as you create their animation sheets
  // puffballMushroom: { ... },
  // dragonfly: { ... },
};

// Helper function to get animation data
export function getAnimationData(
  speciesId: SpeciesId | undefined,
  animationType: keyof SpeciesAnimationSet
): AnimationFrameData | undefined {
  if (!speciesId) return undefined;
  const animations = speciesAnimations[speciesId];
  return animations ? animations[animationType] : undefined;
} 