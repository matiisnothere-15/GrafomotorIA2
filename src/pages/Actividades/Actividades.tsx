import React, { useEffect } from 'react';
import '../Auth/Login.css';
import './Actividades.css';
import HeaderPaciente from '../../components/HeaderPacientes';
import { useNavigate } from 'react-router-dom';

import { useGlobalPaciente } from '../../context/PacienteContext';

// Imports comentados para ejercicios ocultos
// import figura from '../../assets/ejercicios/copia-figuras.png';
// import trazado from '../../assets/ejercicios/trazado-guiado.png';
// import toque from '../../assets/ejercicios/toque-secuencial.png';
// Ocultos por solicitud: selección guiada y conexiones
import coordinacion from '../../assets/ejercicios/coordinacion-motriz.png';
import percepcion from '../../assets/ejercicios/percepcion-visual.png';
import vmiIcono from '../../assets/ejercicios/copia-figuras.png'; // Icono para VMI

const actividades = [
  // Solo se muestran: VMI, Coordinación Motriz, Percepción Visual
  { nombre: 'VMI', icono: vmiIcono, categoria: 'Visomotor', ruta: '/actividad/vmi/parte1/7' },
  { nombre: 'Coordinación Motriz', icono: coordinacion, categoria: 'Motricidad Fina', ruta: '/coordinacion-motriz/nivel1/lineas_horizontales' },
  { nombre: 'Percepción Visual', icono: percepcion, categoria: 'Visomotor', ruta: '/percepcion-visual' },
  // Ejercicios comentados: Copia de Figuras, Trazado Guiado, Toque Secuencial
  // { nombre: 'Copia de Figuras', icono: figura, categoria: 'Motricidad Fina', ruta: '/figuras' },
  // { nombre: 'Trazado Guiado', icono: trazado, categoria: 'Motricidad Fina', ruta: '/actividad/trazado-guiado' },
  // { nombre: 'Toque Secuencial', icono: toque, categoria: 'Visomotor', ruta: '/actividad/toque-secuencial' },
];

const Actividades: React.FC = () => {
  const { nombre, id } = useGlobalPaciente();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Grafomotor IA | Actividades';
  }, []);

  return (
    <div className="activity-wrapper">
      <HeaderPaciente nombre_paciente={nombre!} />

      <main className="home-content">
        <div className="activity-grid">
          {actividades.map((actividad, index) => {
            const onCardClick = () => {
              if (!actividad.ruta) return;
              // Guard simple: rutas protegidas requieren paciente
              const rutaProtegida = actividad.ruta.startsWith('/vmi')
                || actividad.ruta.startsWith('/copiar-figura')
                || actividad.ruta.startsWith('/trazado-guiado')
                || actividad.ruta.startsWith('/coordinacion-motriz')
                || actividad.ruta.startsWith('/actividad');
              console.log('🖱️ Click en card:', actividad.ruta, { rutaProtegida, id, nombre });
              if (rutaProtegida && (!id || !nombre)) {
                alert('Selecciona un paciente antes de entrar al ejercicio.');
                return;
              }
              navigate(actividad.ruta);
            };

            const card = (
              <div
                className="activity-card"
                key={index}
                tabIndex={0}
                role={actividad.ruta ? 'button' : undefined}
                aria-label={actividad.nombre}
                onClick={onCardClick}
                onKeyDown={(e) => {
                  console.log('⌨️ Keydown en card:', e.key, actividad.ruta);
                  if ((e.key === 'Enter' || e.key === ' ') && actividad.ruta) {
                    e.preventDefault();
                    onCardClick();
                  }
                }}
              >
                <h3 className="activity-title">{actividad.nombre}</h3>
                <img src={actividad.icono} alt={actividad.nombre} className="activity-icon" />
                <span className={`activity-tag ${actividad.categoria.replace(/\s+/g, '-').toLowerCase()}`}>
                  {actividad.categoria}
                </span>
              </div>
            );

            return card;
          })}
        </div>
      </main>
    </div>
  );
};

export default Actividades;
