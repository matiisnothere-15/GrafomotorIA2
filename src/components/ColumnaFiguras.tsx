import React, { useState, useEffect } from 'react';
import circulo from '../assets/figuras/circulo.png';
import './ColumnaFiguras.css';
import click from '../assets/sonidos/click.mp3';

interface ColumnaFigurasProps {
    // Array de URLs o imports de las imágenes a mostrar. Cada imagen genera una columna.
    images?: string[];
    // Tamaño en px (ancho y alto) de cada imagen
    size?: number;
    // Posición de la figura correcta
    posicionFiguraCorrecta?: number;
    // Funcion de validacion
    onValidacion?: (esValido: boolean) => void;
    // Señal para reiniciar/deseleccionar desde el padre (incrementar para forzar reset)
    resetSignal?: number;
}

const ColumnaFiguras: React.FC<ColumnaFigurasProps> = ({ images = [], size = 100, posicionFiguraCorrecta, onValidacion, resetSignal }) => {
    // Si no se pasan imágenes, usamos cuatro circulos por defecto
    const imgs = images.length > 0 ? images : [circulo, circulo, circulo, circulo];

    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const audio = new Audio(click);

    const clickFigura = (numFigura: number) => {
        if (numFigura > 0) {
            audio.play();
            setSelectedIndex(() => (numFigura));

            // Validando si la figura seleccionada es la correcta
            if (numFigura === posicionFiguraCorrecta) {
                onValidacion?.(true);
            } else {
                onValidacion?.(false);
            }
        }
    };

    // Si el padre envía una nueva señal, deseleccionamos
    useEffect(() => {
        if (typeof resetSignal !== 'undefined') {
            setSelectedIndex(null);
        }
    }, [resetSignal]);

    return (
        <div style={{ cursor: 'pointer' }}>
            {imgs.map((src, idx) => (
                <div key={idx} className="columna" onClick={() => clickFigura(idx)}>
                    <div className={`${idx === 0 ? 'primera_figura' : ''} ${selectedIndex === idx ? 'seleccionada' : ''}`.trim()}>
                        <img
                            src={src}
                            alt={`Figura ${idx + 1}`}
                            style={{ width: `${size}px`, height: `${size}px`, display: 'block', marginBottom: '10px' }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ColumnaFiguras;