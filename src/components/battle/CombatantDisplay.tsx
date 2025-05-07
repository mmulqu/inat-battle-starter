// src/components/battle/CombatantDisplay.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Combatant } from '../../battle/engine';
import { HPBar } from './HPBar';
import { SpeciesId } from '../../data/species';
import { getAnimationData, AnimationFrameData } from '../../utils/animations'; // Import animation utilities

interface CombatantDisplayProps {
  combatant: Combatant & { speciesId: SpeciesId; maxHp: number }; 
  isActive?: boolean;
  isPlayer?: boolean;
  actionState?: 'idle' | 'attacking' | 'takingDamage' | 'fainted'; // New prop for animation state
  onAnimationComplete?: (type: 'attack' | 'hurt' | 'faint') => void; // Callback for non-looping animations
}

export function CombatantDisplay({
  combatant,
  isActive = false,
  isPlayer = false,
  actionState = 'idle',
  onAnimationComplete,
}: CombatantDisplayProps) {
  const [isFlashingDamage, setIsFlashingDamage] = useState(false);
  const prevHpRef = useRef<number>();

  const [currentAnimation, setCurrentAnimation] = useState<AnimationFrameData | null>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [spriteSheetSrc, setSpriteSheetSrc] = useState<string | null>(null);
  const animationFrameRequestRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);

  // Determine animation type based on actionState
  const targetAnimationType = actionState === 'attacking' ? 'attack' : 'idle';

  useEffect(() => {
    const newAnimData = getAnimationData(combatant.speciesId, targetAnimationType) || getAnimationData(combatant.speciesId, 'idle');

    if (newAnimData) {
      // Only update if the new animation is truly different from the current one
      // or if spriteSheetSrc is not set (initial load for this animation type)
      if (spriteSheetSrc !== newAnimData.sheet || // Primary check: if the resolved sheet path changes
          !currentAnimation || // Or if there's no current animation loaded
          currentAnimation.frames !== newAnimData.frames || // Or if other critical data like frames/fps change
          currentAnimation.fps !== newAnimData.fps
      ) {
        console.log(`[DEBUG CombatantDisplay] Setting NEW animation for ${combatant.speciesId} - ${targetAnimationType}`);
        setCurrentAnimation(newAnimData);
        setSpriteSheetSrc(newAnimData.sheet); 
        setCurrentFrame(0); 
        lastFrameTimeRef.current = performance.now();
      }
    } else {
      // Only clear if it was previously set
      if (spriteSheetSrc !== null || currentAnimation !== null) {
        console.log(`[DEBUG CombatantDisplay] Clearing animation for ${combatant.speciesId}`);
        setCurrentAnimation(null); 
        setSpriteSheetSrc(null); 
        setCurrentFrame(0);
      }
    }
  // Dependency array should only include things that would legitimately change the desired animation.
  }, [combatant.speciesId, targetAnimationType]); // REMOVED currentAnimation from dependencies

  useEffect(() => {
    if (!currentAnimation || !spriteSheetSrc) return;

    const animate = (timestamp: number) => {
      const deltaTime = timestamp - lastFrameTimeRef.current;
      const frameDuration = 1000 / currentAnimation.fps;

      if (deltaTime > frameDuration) {
        lastFrameTimeRef.current = timestamp - (deltaTime % frameDuration);
        setCurrentFrame(prevFrame => {
          const nextFrame = prevFrame + 1;
          if (nextFrame >= currentAnimation.frames) {
            if (currentAnimation.loop) {
              return 0; // Loop back to start
            } else {
              // Animation finished, notify parent 
              if (targetAnimationType !== 'idle' && onAnimationComplete) {
                onAnimationComplete(targetAnimationType as 'attack' | 'hurt' | 'faint');
              }
              // Parent (BattleScene) should now set actionState back to 'idle' via props.
              // The component will then naturally switch to idle animation.
              return currentAnimation.frames -1; // Stay on last frame if not looping
            }
          }
          return nextFrame;
        });
      }
      animationFrameRequestRef.current = requestAnimationFrame(animate);
    };

    animationFrameRequestRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRequestRef.current) {
        cancelAnimationFrame(animationFrameRequestRef.current);
      }
    };
  }, [currentAnimation, spriteSheetSrc, combatant.speciesId, onAnimationComplete, targetAnimationType]);

  // HP Flash effect (existing)
  useEffect(() => {
    if (prevHpRef.current !== undefined && combatant.stats.hp < prevHpRef.current) {
      setIsFlashingDamage(true);
      const timer = setTimeout(() => setIsFlashingDamage(false), 300);
      return () => clearTimeout(timer);
    }
    prevHpRef.current = combatant.stats.hp;
  }, [combatant.stats.hp]);

  const DISPLAY_SIZE = 320; // CHANGED: Desired on-screen size for the sprite (e.g., 128px)

  const spriteStyle: React.CSSProperties = currentAnimation ? {
    width: `${currentAnimation.frameWidth}px`,      // Actual frame width (e.g., 256px)
    height: `${currentAnimation.frameHeight}px`,     // Actual frame height (e.g., 256px)
    backgroundImage: `url(${spriteSheetSrc})`,
    backgroundPosition: `-${currentFrame * currentAnimation.frameWidth}px 0px`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
    transform: `scale(${DISPLAY_SIZE / currentAnimation.frameWidth})`,
    transformOrigin: 'top left',
  } : {
    width: `${DISPLAY_SIZE}px`, // Fallback display size
    height: `${DISPLAY_SIZE}px`, 
    // Consider a fallback static placeholder image URL here if currentAnimation is null
  };

  // Add back for one more check
  // console.log("[DEBUG CombatantDisplay] speciesId:", combatant.speciesId, "actionState:", actionState);
  // console.log("[DEBUG CombatantDisplay] currentAnimation:", currentAnimation);
  // console.log("[DEBUG CombatantDisplay] spriteSheetSrc:", spriteSheetSrc);
  // console.log("[DEBUG CombatantDisplay] currentFrame:", currentFrame);
  console.log("[DEBUG CombatantDisplay] Applied spriteStyle:", JSON.stringify(spriteStyle)); 

  return (
    <div className={`combatant-display ${isPlayer ? 'player' : 'enemy'} ${isActive ? 'active' : ''}`}>
      <div 
        style={spriteStyle} 
        className={`sprite ${isFlashingDamage ? 'taking-damage-flash' : ''}`} 
        role="img" /* Accessibility for div-as-image */ 
        aria-label={combatant.name} 
      />
      <div className="combatant-info-text">
        {combatant.name} (HP: {combatant.stats.hp})
        <span className="status-conditions-container">
          {combatant.statusConditions && combatant.statusConditions.map(status => (
            <span key={status.type} title={`${status.type}${status.duration ? ` (${status.duration})` : ''}`} className={`status-icon status-${status.type.toLowerCase()}`}>
              {status.type.charAt(0).toUpperCase()}
            </span>
          ))}
        </span>
      </div>
      <HPBar currentHp={combatant.stats.hp} maxHp={combatant.maxHp} />
    </div>
  );
}