import React from 'react';
import './ModalActualizacion.css';

interface ModalActualizacionProps {
  isOpen: boolean;
  onClose: () => void;
  titulo: string;
  mensaje: string;
}

export const ModalActualizacion: React.FC<ModalActualizacionProps> = ({
  isOpen,
  onClose,
  titulo,
  mensaje
}) => {
  // Logs de debug
  console.log('🔴 ModalActualizacion renderizado:', { isOpen, titulo });
  
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">{titulo}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p className="modal-message">{mensaje}</p>
          <p className="modal-sub-message">
            Gracias por tu comprensión mientras trabajamos en mejorar la plataforma.
          </p>
        </div>
        <div className="modal-footer">
          <button className="modal-accept" onClick={onClose}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalActualizacion;
