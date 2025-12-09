import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
} from "react-router-dom";

// Auth
import Login from "../pages/Auth/Login";
import PasswordRecovery from "../pages/Auth/PasswordRecovery";

// Dashboard
import Home from "../pages/Home/Home";
import Seguimientos from "../pages/Sesiones/seguimiento";

// Actividades
import Actividades from "../pages/Actividades/Actividades";
import CopiaFigura from "../pages/Actividades/CopiaFigura";
import TrazadoGuiado from "../pages/Actividades/TrazadoGuiado";
import CoordinacionMotriz from "../pages/Actividades/CoordinacionMotriz";
import PercepcionVisual from "../pages/Actividades/PercepcionVisual";
import ToqueSecuencial from "../pages/Actividades/ToqueSecuencial";
import SeleccionFigura from "../pages/Actividades/SeleccionFigura";
import SeleccionTrazado from "../pages/Actividades/SeleccionNivelTrazado";
import VMIParte1 from "../pages/Actividades/VMIParte1";
import ResumenSesionVMI from "../pages/Actividades/ResumenSesionVMI";

// Sesiones
import Sesion from "../pages/Sesiones/Sesion";

// Plan de Tratamiento
import PlanTratamientoPage from "../pages/Plantratamiento/PlanTratamiento";

// Calendario
import Calendario from "../pages/Calendario/Calendario";
import VerSesiones from "../pages/Calendario/VerSesiones";

// Perfil y Config
import Perfil from "../pages/Perfil/Perfil";
import Configuracion from "../pages/configuracion/Configuracion";
import Contactanos from "../pages/Contacto/Contactanos";

// Components
import PrivateRoute from "../components/PrivateRoute";
import PrivatePacienteRoute from "../components/PrivatePacienteRoute";

// Layout
import EjerciciosLayout from "../layouts/EjerciciosLayout";

// Context
import { PacienteProvider } from "../context/PacienteContext";
import { StarProvider } from "../context/StarContext";
import { SessionProvider } from "../context/SessionContext";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Rutas públicas */}
      <Route path="/" element={<Login />} />
      <Route path="/recuperar-contrasena" element={<PasswordRecovery />} />

      {/* Layout para ejercicios */}
      <Route element={<EjerciciosLayout />}>
        <Route path="/actividades" element={<PrivatePacienteRoute><Actividades /></PrivatePacienteRoute>} />

        {/* Selección y ejecución de CopiaFigura */}
        <Route path="/figuras" element={<PrivatePacienteRoute><SeleccionFigura /></PrivatePacienteRoute>} />
        <Route path="/actividad/CopiaFigura" element={<PrivateRoute><CopiaFigura /></PrivateRoute>} />
        <Route path="/copiar-figura/:nivel/:figura" element={<PrivatePacienteRoute><CopiaFigura /></PrivatePacienteRoute>} />

        {/* Selección y ejecución de TrazadoGuiado */}
        <Route path="/trazados" element={<PrivatePacienteRoute><SeleccionTrazado /></PrivatePacienteRoute>} />
        <Route path="/trazado-guiado/:nivel/:figura" element={<PrivatePacienteRoute><TrazadoGuiado /></PrivatePacienteRoute>} />
        <Route path="/actividad/trazado-guiado" element={<PrivatePacienteRoute><SeleccionTrazado /></PrivatePacienteRoute>} />

        {/* Ejecución de Coordinación Motriz */}
        <Route path="/coordinacion-motriz/:nivel/:ejercicio" element={<PrivatePacienteRoute><CoordinacionMotriz /></PrivatePacienteRoute>} />

        {/* Ejecución de Percepción Visual */}
        <Route path="/percepcion-visual" element={<PrivatePacienteRoute><PercepcionVisual /></PrivatePacienteRoute>} />

        {/* Selección y ejecución de Toque Secuencial */}
        <Route path="/actividad/toque-secuencial" element={<PrivatePacienteRoute><ToqueSecuencial /></PrivatePacienteRoute>} />

        {/* VMI Parte 1: Copia de Figuras */}
        <Route path="/actividad/vmi/parte1/:ejercicio" element={<VMIParte1 />} />
        <Route path="/actividad/vmi/resumen" element={<ResumenSesionVMI />} />

      </Route>

      {/* Rutas protegidas */}
      <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />

      <Route path="/PlanTratamiento" element={<PrivateRoute><PlanTratamientoPage /></PrivateRoute>} />

      <Route path="/Contactanos" element={<PrivateRoute><Contactanos /></PrivateRoute>} />

      <Route path="/Sesion" element={<PrivateRoute><Sesion /></PrivateRoute>} />

      <Route path="/Calendario" element={<PrivateRoute><Calendario /></PrivateRoute>} />

      <Route path="/Seguimientos" element={<PrivateRoute><Seguimientos /></PrivateRoute>} />

      <Route path="/ver-sesiones" element={<VerSesiones />} />

      <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />

      <Route path="/configuracion" element={<PrivateRoute><Configuracion /></PrivateRoute>} />

    </>
  ),
  {
    basename: import.meta.env.BASE_URL
  }
);

export default function AppRouter() {
  return (
    <PacienteProvider>
      <StarProvider>
        <SessionProvider>
          <RouterProvider router={router} />
        </SessionProvider>
      </StarProvider>
    </PacienteProvider>
  );
}