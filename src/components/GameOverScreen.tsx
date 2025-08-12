// src/components/GameOverScreen.tsx
import React from 'react';

interface GameOverScreenProps {
    winnerName?: string; // Winner's name, or undefined for a draw/generic end
    onPlayAgain: () => void;
}

export function GameOverScreen({ winnerName, onPlayAgain }: GameOverScreenProps) {
    let message = "The Battle Has Ended!";
    if (winnerName) {
        message = `${winnerName} is Victorious!`;
    }

    return (
        <div
            className="game-over-screen"
            style={{
                textAlign: 'center',
                padding: '40px',
                background: '#1b2036',
                border: '1px solid #2a2f47',
                borderRadius: '12px',
                color: '#f3f5f7',
                boxShadow: '0 8px 24px rgba(0,0,0,.5)',
                width: '100%',
                maxWidth: '560px'
            }}
        >
            <h1 style={{ fontSize: '2.2em', marginBottom: '10px', marginTop: 0 }}>Game Over</h1>
            <p style={{ fontSize: '1.6em', color: '#22c55e', marginBottom: '24px', fontWeight: 'bold' }}>
                {message}
            </p>
            <button
                onClick={onPlayAgain}
                style={{
                    padding: '12px 22px',
                    fontSize: '1.05em',
                    background: '#22c55e'
                }}
            >
                Play Again
            </button>
        </div>
    );
}