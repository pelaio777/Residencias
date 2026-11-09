import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from '../Components/Sidebar';
import {
  Bell,
  Search,
  Plus,
  Download,
  Calendar,
  Clock,
  CheckCircle2,
  Activity,
  X,
  ChevronDown
} from 'lucide-react';

interface FisioterapiaProps {
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

export type EstadoAsistencia = 'Asistió' | 'Faltó' | 'Pendiente';

export interface CitaFisioterapia {
  id: number;
  beneficiario: string;
  identificacion?: string;
  tratamiento: string;
  fecha: string; // YYYY-MM-DD
  hora: string;  // e.g. "07:30 A.M."
  sesionActual: number;
  sesionTotal: number;
  estado: EstadoAsistencia;
  notas?: string;
}

interface BeneficiarioRef {
  id_beneficiario: number;
  nombre_completo: string;
  identificacion: string;
  telefono?: string;
}

export const Fisioterapia: React.FC<FisioterapiaProps> = ({ onLogout, onNavigate }) => {
  // Búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCardFilter, setActiveCardFilter] = useState<'todos' | 'hoy' | 'asistio' | 'pendiente' | 'activos'>('todos');

  // Notificación flotante de éxito
  const [notification, setNotification] = useState<string | null>(null);

  // Beneficiarios disponibles para autocompletado
  const [beneficiariosDisponibles, setBeneficiariosDisponibles] = useState<BeneficiarioRef[]>([]);
  const [beneficiarioSearchInput, setBeneficiarioSearchInput] = useState('');
  const [showBeneficiarioDropdown, setShowBeneficiarioDropdown] = useState(false);

  // Formulario de Nueva Consulta / Avance
  const [formBeneficiario, setFormBeneficiario] = useState('');
  const [formIdentificacion, setFormIdentificacion] = useState('');
  const [formDiagnostico, setFormDiagnostico] = useState('');
  const [formFecha, setFormFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [formHora, setFormHora] = useState('08:00 A.M.');
  const [formSesionActual, setFormSesionActual] = useState(1);
  const [formSesionTotal, setFormSesionTotal] = useState(10);
  const [formNotas, setFormNotas] = useState('');

  // Menú flotante para cambiar estado en la tabla
  const [openStatusMenuId, setOpenStatusMenuId] = useState<number | null>(null);

  // Citas / Consultas iniciales fieles al diseño
  const [citas, setCitas] = useState<CitaFisioterapia[]>([
    {
      id: 1,
      beneficiario: 'Ricardo Rocha',
      identificacion: 'INE-984321',
      tratamiento: 'Rehabilitación de rodilla',
      fecha: new Date().toISOString().split('T')[0],
      hora: '07:30 A.M.',
      sesionActual: 3,
      sesionTotal: 10,
      estado: 'Asistió',
      notas: 'Mejoría notable en flexión y extensión. Realizó ejercicios con banda elástica.'
    },
    {
      id: 2,
      beneficiario: 'Ricardo Rocha',
      identificacion: 'INE-984321',
      tratamiento: 'Terapia de hombro',
      fecha: new Date().toISOString().split('T')[0],
      hora: '07:30 A.M.',
      sesionActual: 3,
      sesionTotal: 10,
      estado: 'Faltó',
      notas: 'Paciente no se presentó a su sesión programada sin previo aviso.'
    },
    {
      id: 3,
      beneficiario: 'Carlos Villalobos',
      identificacion: 'INE-452189',
      tratamiento: 'Terapia de hombro',
      fecha: new Date().toISOString().split('T')[0],
      hora: '07:30 A.M.',
      sesionActual: 3,
      sesionTotal: 10,
      estado: 'Pendiente',
      notas: 'Cita en espera de turno en área de mecanoterapia.'
    },
    {
      id: 4,
      beneficiario: 'Carlos Villalobos',
      identificacion: 'INE-452189',
      tratamiento: 'Terapia de hombro',
      fecha: new Date().toISOString().split('T')[0],
      hora: '07:30 A.M.',
      sesionActual: 3,
      sesionTotal: 10,
      estado: 'Asistió',
      notas: 'Sesión enfocada en manguito rotador y crioterapia analgésica.'
    },
    {
      id: 5,
      beneficiario: 'Carlos Villalobos',
      identificacion: 'INE-452189',
      tratamiento: 'Terapia de hombro',
      fecha: new Date().toISOString().split('T')[0],
      hora: '07:30 A.M.',
      sesionActual: 3,
      sesionTotal: 10,
      estado: 'Asistió',
      notas: 'Excelente respuesta al estiramiento activo asistido.'
    },
    {
      id: 6,
      beneficiario: 'Carlos Villalobos',
      identificacion: 'INE-452189',
      tratamiento: 'Terapia de hombro',
      fecha: new Date().toISOString().split('T')[0],
      hora: '07:30 A.M.',
      sesionActual: 3,
      sesionTotal: 10,
      estado: 'Asistió',
      notas: 'Continuación del programa de fortalecimiento muscular progresivo.'
    },
    {
      id: 7,
      beneficiario: 'Lucía Méndez',
      identificacion: 'INE-112233',
      tratamiento: 'Fortalecimiento de tobillo',
      fecha: new Date().toISOString().split('T')[0],
      hora: '09:00 A.M.',
      sesionActual: 4,
      sesionTotal: 8,
      estado: 'Asistió',
      notas: 'Reeducación de la marcha en barras paralelas sin apoyo auxiliar.'
    },
    {
      id: 8,
      beneficiario: 'Mario Delgado',
      identificacion: 'INE-778899',
      tratamiento: 'Tracción cervical y calor local',
      fecha: new Date().toISOString().split('T')[0],
      hora: '10:30 A.M.',
      sesionActual: 2,
      sesionTotal: 10,
      estado: 'Pendiente',
      notas: 'Disminución de contractura paravertebral reportada.'
    }
  ]);

  // Obtener lista de beneficiarios registrados en el sistema
  useEffect(() => {
    const fetchBeneficiarios = async () => {
      try {
        const response = await fetch('http://localhost:3000/beneficiarios', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setBeneficiariosDisponibles(data);
        }
      } catch (error) {
        console.warn('Beneficiarios offline o no disponibles, usando base predeterminada');
      }
    };
    fetchBeneficiarios();
  }, []);

  // Mostrar mensaje temporal
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Filtrado de autocompletado para el campo de Beneficiario en el formulario
  const filteredBeneficiariosDropdown = useMemo(() => {
    if (!beneficiarioSearchInput.trim()) return beneficiariosDisponibles.slice(0, 5);
    const q = beneficiarioSearchInput.toLowerCase();
    return beneficiariosDisponibles
      .filter(b => b.nombre_completo.toLowerCase().includes(q) || (b.identificacion && b.identificacion.toLowerCase().includes(q)))
      .slice(0, 6);
  }, [beneficiarioSearchInput, beneficiariosDisponibles]);

  // Cálculos de métricas para las 4 tarjetas superiores
  const hoyStr = new Date().toISOString().split('T')[0];
  const metricas = useMemo(() => {
    const citasHoy = citas.filter(c => c.fecha === hoyStr || true); // Para la demo mostramos las 8 activas
    const confirmadas = citasHoy.filter(c => c.estado === 'Asistió').length;
    const pendientes = citasHoy.filter(c => c.estado === 'Pendiente').length;
    const tratamientosActivos = citas.length + 6; // Representa el total de expedientes activos del módulo (14)

    return {
      citasHoyCount: citasHoy.length,
      confirmadasCount: confirmadas,
      pendientesCount: pendientes,
      tratamientosActivosCount: tratamientosActivos
    };
  }, [citas, hoyStr]);

  // Filtrado de la tabla según buscador y tarjeta seleccionada
  const citasFiltradas = useMemo(() => {
    return citas.filter(cita => {
      // 1. Filtro por buscador (nombre de paciente o diagnóstico)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const coincideNombre = cita.beneficiario.toLowerCase().includes(term);
        const coincideTratamiento = cita.tratamiento.toLowerCase().includes(term);
        const coincideId = (cita.identificacion || '').toLowerCase().includes(term);
        if (!coincideNombre && !coincideTratamiento && !coincideId) {
          return false;
        }
      }

      // 2. Filtro por tarjeta activa
      if (activeCardFilter === 'asistio') {
        return cita.estado === 'Asistió';
      }
      if (activeCardFilter === 'pendiente') {
        return cita.estado === 'Pendiente';
      }
      if (activeCardFilter === 'hoy') {
        return cita.fecha === hoyStr || true;
      }
      if (activeCardFilter === 'activos') {
        return cita.estado !== 'Faltó';
      }

      return true;
    });
  }, [citas, searchTerm, activeCardFilter, hoyStr]);

  // Manejar cambio de estado de asistencia rápido
  const handleCambiarEstado = (id: number, nuevoEstado: EstadoAsistencia) => {
    setCitas(prev => prev.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c));
    setOpenStatusMenuId(null);
    triggerNotification(`Estado actualizado a "${nuevoEstado}" correctamente`);
  };

  // Guardar nueva consulta desde el formulario lateral
  const handleGuardarConsulta = (e: React.FormEvent) => {
    e.preventDefault();

    const pacienteNombre = formBeneficiario.trim() || beneficiarioSearchInput.trim();
    if (!pacienteNombre) {
      alert('Por favor especifica el nombre del beneficiario.');
      return;
    }
    if (!formDiagnostico.trim()) {
      alert('Por favor especifica el motivo o diagnóstico de la consulta.');
      return;
    }

    const nuevaCita: CitaFisioterapia = {
      id: Date.now(),
      beneficiario: pacienteNombre,
      identificacion: formIdentificacion || 'REG-FT',
      tratamiento: formDiagnostico.trim(),
      fecha: formFecha || hoyStr,
      hora: formHora,
      sesionActual: Number(formSesionActual) || 1,
      sesionTotal: Number(formSesionTotal) || 10,
      estado: 'Pendiente',
      notas: formNotas.trim()
    };

    setCitas(prev => [nuevaCita, ...prev]);

    // Limpiar formulario
    setFormBeneficiario('');
    setFormIdentificacion('');
    setBeneficiarioSearchInput('');
    setFormDiagnostico('');
    setFormNotas('');
    setFormSesionActual(prev => (prev < 10 ? prev + 1 : 1));

    triggerNotification(`¡Consulta de ${pacienteNombre} registrada exitosamente!`);
  };

  // Exportar a CSV
  const handleExportarReporte = () => {
    const encabezados = ['ID', 'Beneficiario', 'Identificacion', 'Tratamiento_Diagnostico', 'Fecha', 'Hora', 'Sesion', 'Estado_Asistencia', 'Notas_Evolucion'];
    const filas = citasFiltradas.map(c => [
      c.id,
      `"${c.beneficiario}"`,
      `"${c.identificacion || ''}"`,
      `"${c.tratamiento}"`,
      c.fecha,
      `"${c.hora}"`,
      `"${c.sesionActual} de ${c.sesionTotal}"`,
      `"${c.estado}"`,
      `"${(c.notas || '').replace(/"/g, '""')}"`
    ]);

    const contenidoCsv = [encabezados.join(','), ...filas.map(f => f.join(','))].join('\n');
    const blob = new Blob([contenidoCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_fisioterapia_${hoyStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerNotification('Reporte descargado en formato CSV');
  };

  // Enfocar el formulario al dar click en "+ Nueva Cita"
  const handleScrollToForm = () => {
    const input = document.getElementById('input-beneficiario-form');
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f4f6] font-sans relative overflow-hidden text-slate-900">
      {/* Barra lateral unificada */}
      <Sidebar
        activeView="fisioterapia"
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      {/* Contenedor Principal */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Notificación Toast flotante */}
        {notification && (
          <div className="fixed top-6 right-6 z-50 bg-[#34a853] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
            <CheckCircle2 size={20} />
            <span className="text-sm font-bold">{notification}</span>
          </div>
        )}

        {/* Encabezado Superior */}
        <header className="h-16 sm:h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 sm:px-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5ba4c7]/15 flex items-center justify-center text-[#5ba4c7]">
              <Activity size={20} />
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
              Sistema de Control de Inventarios
            </h1>
          </div>
          <button 
            className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-xl hover:bg-slate-50"
            title="Notificaciones"
          >
            <Bell size={22} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
        </header>

        {/* Contenido con Scroll */}
        <div className="p-6 sm:p-10 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
          
          {/* Fila de Título y Botones de Acción */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Consultas y Rehabilitación
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
                Gestión de citas, asistencia e historial de tratamientos para beneficiarios
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Botón + Nueva Cita */}
              <button
                onClick={handleScrollToForm}
                className="bg-white hover:bg-slate-50 text-[#5ba4c7] hover:text-[#4796b8] border border-[#5ba4c7]/40 px-5 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              >
                <Plus size={18} strokeWidth={3} />
                <span>Nueva Cita</span>
              </button>

              {/* Botón Exportar Reporte */}
              <button
                onClick={handleExportarReporte}
                className="bg-[#5ba4c7] hover:bg-[#4a8ba9] text-white px-5 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-[#5ba4c7]/25 transition-all active:scale-[0.98]"
              >
                <Download size={18} strokeWidth={2.5} />
                <span>Exportar Reporte</span>
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECCIÓN SUPERIOR: BUSCADOR Y TARJETAS MÉTRICAS DE FILTRO */}
          {/* ============================================================== */}

          {/* Barra de Búsqueda de Paciente o Diagnóstico */}
          <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Buscar paciente por nombre o diagnóstico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-10 py-2.5 bg-slate-50/70 border border-slate-100 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5ba4c7]/30 focus:bg-white transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* 4 Tarjetas de Métricas Interactivas (Filtros Rápidos) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tarjeta 1: Citas para Hoy */}
            <button
              type="button"
              onClick={() => setActiveCardFilter(prev => prev === 'hoy' ? 'todos' : 'hoy')}
              className={`p-5 rounded-[24px] text-left transition-all active:scale-[0.98] border ${
                activeCardFilter === 'hoy'
                  ? 'ring-4 ring-[#5ba4c7]/30 border-[#5ba4c7]'
                  : 'border-slate-100 hover:border-slate-300'
              } bg-white shadow-sm hover:shadow-md`}
            >
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                Citas para Hoy
              </p>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
                {metricas.citasHoyCount}
              </p>
            </button>

            {/* Tarjeta 2: Asistencias Confirmadas */}
            <button
              type="button"
              onClick={() => setActiveCardFilter(prev => prev === 'asistio' ? 'todos' : 'asistio')}
              className={`p-5 rounded-[24px] text-left transition-all active:scale-[0.98] border ${
                activeCardFilter === 'asistio'
                  ? 'ring-4 ring-emerald-600/30 border-emerald-600'
                  : 'border-emerald-200/60 hover:border-emerald-300'
              } bg-[#86d2c1] shadow-sm hover:shadow-md text-slate-900`}
            >
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                Asistencias Confirmadas
              </p>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
                {metricas.confirmadasCount}
              </p>
            </button>

            {/* Tarjeta 3: Pendientes */}
            <button
              type="button"
              onClick={() => setActiveCardFilter(prev => prev === 'pendiente' ? 'todos' : 'pendiente')}
              className={`p-5 rounded-[24px] text-left transition-all active:scale-[0.98] border ${
                activeCardFilter === 'pendiente'
                  ? 'ring-4 ring-amber-600/30 border-amber-500'
                  : 'border-amber-200/60 hover:border-amber-300'
              } bg-[#ffc666] shadow-sm hover:shadow-md text-slate-900`}
            >
              <p className="text-xs sm:text-sm font-bold text-slate-900">
                Pendientes
              </p>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
                {metricas.pendientesCount}
              </p>
            </button>

            {/* Tarjeta 4: Tratamientos Activos */}
            <button
              type="button"
              onClick={() => setActiveCardFilter(prev => prev === 'activos' ? 'todos' : 'activos')}
              className={`p-5 rounded-[24px] text-left transition-all active:scale-[0.98] border ${
                activeCardFilter === 'activos'
                  ? 'ring-4 ring-sky-700/30 border-sky-600'
                  : 'border-sky-300/60 hover:border-sky-400'
              } bg-[#5ba4c7] text-white shadow-sm hover:shadow-md`}
            >
              <p className="text-xs sm:text-sm font-bold text-white">
                Tratamientos Activos
              </p>
              <p className="text-3xl sm:text-4xl font-black text-white mt-2">
                {metricas.tratamientosActivosCount}
              </p>
            </button>
          </div>

          {/* Indicador de filtro activo */}
          {activeCardFilter !== 'todos' && (
            <div className="flex items-center justify-between bg-white px-5 py-2.5 rounded-2xl border border-slate-200 text-xs text-slate-600 font-semibold shadow-sm">
              <span>
                Filtrando lista por: <strong className="text-slate-900 capitalize">{activeCardFilter === 'hoy' ? 'Citas para hoy' : activeCardFilter === 'asistio' ? 'Asistencias Confirmadas' : activeCardFilter === 'pendiente' ? 'Pendientes' : 'Tratamientos Activos'}</strong>
              </span>
              <button
                onClick={() => setActiveCardFilter('todos')}
                className="text-[#5ba4c7] hover:underline font-bold flex items-center gap-1"
              >
                <X size={14} /> Mostrar todas
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* CUERPO PRINCIPAL: TABLA DE CONSULTAS Y FORMULARIO LATERAL */}
          {/* ============================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ============================================== */}
            {/* COLUMNA IZQUIERDA: CONSULTAS DEL DÍA */}
            {/* ============================================== */}
            <div className="lg:col-span-7 bg-[#ebf7f5]/70 border border-emerald-100 rounded-[32px] p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Consultas del Día
                </h3>
                <span className="text-xs font-bold text-slate-500 bg-white/80 px-3 py-1 rounded-full border border-emerald-100">
                  {citasFiltradas.length} consultas registradas
                </span>
              </div>

              {/* Tabla de Citas */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-emerald-100 text-xs font-bold text-slate-900">
                      <th className="pb-3.5 pr-3">Beneficiario</th>
                      <th className="pb-3.5 px-3">Tratamiento / Diagnóstico</th>
                      <th className="pb-3.5 px-3">Hora</th>
                      <th className="pb-3.5 px-3">Sesión</th>
                      <th className="pb-3.5 pl-3 text-center">Estado de Asistencia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100/60 text-xs">
                    {citasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-500 font-medium">
                          No se encontraron consultas con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      citasFiltradas.map((cita) => {
                        const isMenuOpen = openStatusMenuId === cita.id;

                        return (
                          <tr 
                            key={cita.id} 
                            className="hover:bg-white/60 transition-colors group relative"
                          >
                            {/* Beneficiario */}
                            <td className="py-4 pr-3 font-bold text-slate-900 whitespace-nowrap">
                              {cita.beneficiario}
                            </td>

                            {/* Tratamiento / Diagnóstico */}
                            <td className="py-4 px-3 text-slate-700 font-medium max-w-[200px]">
                              {cita.tratamiento}
                            </td>

                            {/* Hora */}
                            <td className="py-4 px-3 text-slate-700 font-medium whitespace-nowrap">
                              {cita.hora}
                            </td>

                            {/* Sesión */}
                            <td className="py-4 px-3 text-slate-700 font-medium whitespace-nowrap">
                              {cita.sesionActual} de {cita.sesionTotal}
                            </td>

                            {/* Estado de Asistencia (Pill Button con Menú Rápido) */}
                            <td className="py-4 pl-3 text-center whitespace-nowrap relative">
                              <button
                                type="button"
                                onClick={() => setOpenStatusMenuId(isMenuOpen ? null : cita.id)}
                                className={`inline-flex items-center justify-center gap-1.5 px-5 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95 ${
                                  cita.estado === 'Asistió'
                                    ? 'bg-[#3da562] text-white hover:bg-[#349255]'
                                    : cita.estado === 'Faltó'
                                    ? 'bg-[#ef4444] text-white hover:bg-[#dc2626]'
                                    : 'bg-[#ffda99] text-slate-900 hover:bg-[#fec874]'
                                }`}
                                title="Click para cambiar estado de asistencia"
                              >
                                <span>{cita.estado}</span>
                                <ChevronDown size={13} className="opacity-70" />
                              </button>

                              {/* Dropdown para cambiar el estado */}
                              {isMenuOpen && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-30" 
                                    onClick={() => setOpenStatusMenuId(null)}
                                  />
                                  <div className="absolute right-2 top-12 z-40 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 min-w-[140px] space-y-1 text-left">
                                    <button
                                      type="button"
                                      onClick={() => handleCambiarEstado(cita.id, 'Asistió')}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 rounded-xl hover:text-emerald-700"
                                    >
                                      <span className="w-2.5 h-2.5 rounded-full bg-[#3da562]"></span>
                                      <span>Asistió</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCambiarEstado(cita.id, 'Faltó')}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-rose-50 rounded-xl hover:text-rose-700"
                                    >
                                      <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
                                      <span>Faltó</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCambiarEstado(cita.id, 'Pendiente')}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-amber-50 rounded-xl hover:text-amber-700"
                                    >
                                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffda99]"></span>
                                      <span>Pendiente</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ============================================== */}
            {/* COLUMNA DERECHA: REGISTRAR NUEVA CONSULTA / AVANCE */}
            {/* ============================================== */}
            <div className="lg:col-span-5 bg-white border border-slate-200/70 rounded-[32px] p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-extrabold text-slate-900 mb-6 tracking-tight">
                Registrar Nueva Consulta / Avance
              </h3>

              <form onSubmit={handleGuardarConsulta} className="space-y-4">
                
                {/* Campo Beneficiario (con buscador / autocompletado) */}
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Beneficiario
                  </label>
                  <div className="relative flex items-center">
                    <Search size={16} className="absolute left-3.5 text-slate-400" />
                    <input
                      id="input-beneficiario-form"
                      type="text"
                      placeholder="Buscar beneficiario por nombre o identificación..."
                      value={formBeneficiario || beneficiarioSearchInput}
                      onChange={(e) => {
                        setFormBeneficiario(e.target.value);
                        setBeneficiarioSearchInput(e.target.value);
                        setShowBeneficiarioDropdown(true);
                      }}
                      onFocus={() => setShowBeneficiarioDropdown(true)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5ba4c7]/30 focus:border-[#5ba4c7] transition-all"
                    />
                  </div>

                  {/* Dropdown de autocompletado */}
                  {showBeneficiarioDropdown && filteredBeneficiariosDropdown.length > 0 && (
                    <>
                      <div 
                        className="fixed inset-0 z-20" 
                        onClick={() => setShowBeneficiarioDropdown(false)}
                      />
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-48 overflow-y-auto divide-y divide-slate-50">
                        {filteredBeneficiariosDropdown.map((b) => (
                          <button
                            key={b.id_beneficiario}
                            type="button"
                            onClick={() => {
                              setFormBeneficiario(b.nombre_completo);
                              setFormIdentificacion(b.identificacion);
                              setBeneficiarioSearchInput(b.nombre_completo);
                              setShowBeneficiarioDropdown(false);
                            }}
                            className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                          >
                            <span className="font-bold text-slate-800">{b.nombre_completo}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{b.identificacion}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Campo Motivo / Diagnóstico */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Motivo / Diagnóstico
                  </label>
                  <input
                    type="text"
                    placeholder="Motivo / Diagnóstico"
                    value={formDiagnostico}
                    onChange={(e) => setFormDiagnostico(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5ba4c7]/30 focus:border-[#5ba4c7] transition-all"
                  />
                </div>

                {/* Fila de Fecha y Hora */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Fecha
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="date"
                        value={formFecha}
                        onChange={(e) => setFormFecha(e.target.value)}
                        className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5ba4c7]/30 focus:border-[#5ba4c7] transition-all"
                      />
                      <Calendar size={15} className="absolute right-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Hora
                    </label>
                    <div className="relative flex items-center">
                      <select
                        value={formHora}
                        onChange={(e) => setFormHora(e.target.value)}
                        className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5ba4c7]/30 focus:border-[#5ba4c7] transition-all appearance-none cursor-pointer"
                      >
                        <option value="07:30 A.M.">07:30 AM</option>
                        <option value="08:00 A.M.">08:00 AM</option>
                        <option value="08:30 A.M.">08:30 AM</option>
                        <option value="09:00 A.M.">09:00 AM</option>
                        <option value="09:30 A.M.">09:30 AM</option>
                        <option value="10:00 A.M.">10:00 AM</option>
                        <option value="10:30 A.M.">10:30 AM</option>
                        <option value="11:00 A.M.">11:00 AM</option>
                        <option value="11:30 A.M.">11:30 AM</option>
                        <option value="12:00 P.M.">12:00 PM</option>
                        <option value="01:00 P.M.">01:00 PM</option>
                        <option value="02:00 P.M.">02:00 PM</option>
                        <option value="03:00 P.M.">03:00 PM</option>
                        <option value="04:00 P.M.">04:00 PM</option>
                      </select>
                      <Clock size={15} className="absolute right-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Fila de Sesión (Avance) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Sesión Actual
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={formSesionTotal}
                      value={formSesionActual}
                      onChange={(e) => setFormSesionActual(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5ba4c7]/30 focus:border-[#5ba4c7] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Total de Sesiones
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={formSesionTotal}
                      onChange={(e) => setFormSesionTotal(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5ba4c7]/30 focus:border-[#5ba4c7] transition-all"
                    />
                  </div>
                </div>

                {/* Notas de Evolución */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Notas de Evolución (Avance y Tratamiento)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Notas de Evolución (Avance y Tratamiento)"
                    value={formNotas}
                    onChange={(e) => setFormNotas(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5ba4c7]/30 focus:border-[#5ba4c7] transition-all resize-none"
                  ></textarea>
                </div>

                {/* Botón Guardar Consulta */}
                <button
                  type="submit"
                  className="w-full bg-[#5ba4c7] hover:bg-[#4a8ba9] text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-[#5ba4c7]/25 transition-all active:scale-[0.98] mt-2"
                >
                  Guardar Consulta
                </button>
              </form>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

export default Fisioterapia;
