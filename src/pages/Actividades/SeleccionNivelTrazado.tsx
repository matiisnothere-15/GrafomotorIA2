import React, { useEffect } from 'react';
import HeaderPaciente from '../../components/HeaderPacientes';
import { useGlobalPaciente } from '../../context/PacienteContext';
import { Link } from 'react-router-dom';
import './SeleccionFigura.css';

import curvasE from '../../assets/trazados/curvasE.png';
import dobleEspiral from '../../assets/trazados/doble-espiral.png';
import espiral from '../../assets/trazados/espiral.png';
import montaña from '../../assets/trazados/montaña.png';
import ola from '../../assets/trazados/ola.png';
import ondas from '../../assets/trazados/ondas.png';
import punteagudo from '../../assets/trazados/punteagudo.png';
import caminocurva from '../../assets/trazados/caminocurva.png';
import zigzagEspiral from '../../assets/trazados/zigzag_espiral.png';


const trazados = [
  { nombre: 'Montaña', icono: montaña, nivel: 1, id: 'montaña' },
  { nombre: 'Ondas', icono: ondas, nivel: 1, id: 'ondas' },
  { nombre: 'Ola', icono: ola, nivel: 1, id: 'ola' },
];


const SeleccionTrazado: React.FC = () => {
  const { nombre } = useGlobalPaciente();

  useEffect(() => {
    document.title = 'Selecciona un Trazado';
  }, []);

  return (
    <div className="seleccionfigura-wrapper">
      <HeaderPaciente nombre_paciente={nombre!} />
      <main>
        <div className="seleccionfigura-grid">
          {trazados.map((trazo) => {
            const ruta = `/trazado-guiado/nivel1/${trazo.id}`;

            return (
              <Link to={ruta} key={trazo.nombre} className="activity-card-link">
                <div className="seleccionfigura-card" tabIndex={0}>
                  <h3>{trazo.nombre}</h3>
                  <img src={trazo.icono} alt={trazo.nombre} />
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default SeleccionTrazado;
