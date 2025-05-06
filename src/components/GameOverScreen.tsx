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
                background: '#2d3248',
                borderRadius: '12px',
                color: '#f8f8f8',
                boxShadow: '0 6px 20px rgba(0,0,0,.5)',
                width: '100%',
                maxWidth: '500px'
            }}
        >
            <h1 style={{ fontSize: '2.5em', marginBottom: '10px' }}>Game Over</h1>
            <p style={{ fontSize: '1.8em', color: '#3ad87b', marginBottom: '30px', fontWeight: 'bold' }}>
                {message}
            </p>
            <button
                onClick={onPlayAgain}
                style={{
                    padding: '12px 25px',
                    fontSize: '1.2em',
                    background: '#3ad87b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#32c06c'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3ad87b'}
            >
                Play Again?
            </button>
        </div>
    );
}