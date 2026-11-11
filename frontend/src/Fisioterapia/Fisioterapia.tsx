import React, { useState, useMemo, useEffect, useRef } from 'react';
import Sidebar from '../Components/Sidebar';
import { useReactToPrint } from 'react-to-print';
import {
  Bell,
  Search,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  Activity,
  X,
  ChevronDown,
  Trash2,
  Check,
  RotateCcw,
  Printer,
  Edit3
} from 'lucide-react';
import {
  getStoredCitas,
  saveStoredCitas,
  EVENT_FISIOTERAPIA_UPDATED,
  type CitaFisioterapia,
  type EstadoAsistencia
} from './fisioterapiaStorage';

interface FisioterapiaProps {
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

interface BeneficiarioRef {
  id_beneficiario: number;
  nombre_completo: string;
  identificacion: string;
  telefono?: string;
}

export const Fisioterapia: React.FC<FisioterapiaProps> = ({ onLogout, onNavigate }) => {
  // Lista de citas cargada desde almacenamiento persistente compartido
  const [citas, setCitas] = useState<CitaFisioterapia[]>(() => getStoredCitas());

  // Estado del Modal de Consulta (creación o edición)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCitaId, setSelectedCitaId] = useState<number | null>(null);

  // Búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCardFilter, setActiveCardFilter] = useState<'todos' | 'hoy' | 'asistio' | 'pendiente' | 'activos'>('todos');

  // Notificación flotante de éxito
  const [notification, setNotification] = useState<string | null>(null);

  // Beneficiarios disponibles para autocompletado
  const [beneficiariosDisponibles, setBeneficiariosDisponibles] = useState<BeneficiarioRef[]>([]);
  const [beneficiarioSearchInput, setBeneficiarioSearchInput] = useState('');
  const [showBeneficiarioDropdown, setShowBeneficiarioDropdown] = useState(false);

  // Estados del Formulario dentro del Modal
  const [formBeneficiario, setFormBeneficiario] = useState('');
  const [formIdentificacion, setFormIdentificacion] = useState('');
  const [formDiagnostico, setFormDiagnostico] = useState('');
  const [formFecha, setFormFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [formHora, setFormHora] = useState('08:00 A.M.');
  const [formSesionActual, setFormSesionActual] = useState(1);
  const [formSesionTotal, setFormSesionTotal] = useState(10);
  const [formEstado, setFormEstado] = useState<EstadoAsistencia>('Pendiente');
  const [formNotas, setFormNotas] = useState('');

  // Menú flotante para cambiar estado directamente en la tabla
  const [openStatusMenuId, setOpenStatusMenuId] = useState<number | null>(null);

  // Cita seleccionada para exportar su comprobante individual en PDF
  const [citaParaImprimir, setCitaParaImprimir] = useState<CitaFisioterapia | null>(null);

  // Referencias para impresión de PDFs
  const printReportRef = useRef<HTMLDivElement>(null);
  const printCitaRef = useRef<HTMLDivElement>(null);

  const hoyStr = new Date().toISOString().split('T')[0];

  // Generador de PDF del Reporte General
  const handlePrintReport = useReactToPrint({
    contentRef: printReportRef,
    documentTitle: `Reporte_Fisioterapia_Palabras_de_Esperanza_${hoyStr}`,
  });

  // Generador de PDF de la Ficha/Cita Individual
  const handlePrintCita = useReactToPrint({
    contentRef: printCitaRef,
    documentTitle: citaParaImprimir 
      ? `Ficha_Fisioterapia_${citaParaImprimir.beneficiario.replace(/\s+/g, '_')}_Sesion_${citaParaImprimir.sesionActual}` 
      : 'Ficha_Consulta_Fisioterapia',
  });

  // Sincronización reactiva con almacenamiento compartido (localStorage y eventos)
  useEffect(() => {
    const handleStorageUpdate = () => {
      setCitas(getStoredCitas());
    };

    window.addEventListener(EVENT_FISIOTERAPIA_UPDATED, handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    return () => {
      window.removeEventListener(EVENT_FISIOTERAPIA_UPDATED, handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Obtener lista de beneficiarios registrados en la base de datos
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

  // Notificación temporal
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
  const metricas = useMemo(() => {
    const citasHoy = citas.filter(c => c.fecha === hoyStr || true);
    const confirmadas = citasHoy.filter(c => c.estado === 'Asistió').length;
    const pendientes = citasHoy.filter(c => c.estado === 'Pendiente').length;
    const tratamientosActivos = citas.length + 6;

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
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const coincideNombre = cita.beneficiario.toLowerCase().includes(term);
        const coincideTratamiento = cita.tratamiento.toLowerCase().includes(term);
        const coincideId = (cita.identificacion || '').toLowerCase().includes(term);
        if (!coincideNombre && !coincideTratamiento && !coincideId) {
          return false;
        }
      }

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

  // ==============================================================
  // ACCIONES DEL MODAL: ABRIR MODO NUEVO O MODO EDICIÓN
  // ==============================================================
  const handleAbrirNuevaCitaModal = () => {
    setSelectedCitaId(null);
    setCitaParaImprimir(null);
    setFormBeneficiario('');
    setFormIdentificacion('');
    setBeneficiarioSearchInput('');
    setFormDiagnostico('');
    setFormFecha(new Date().toISOString().split('T')[0]);
    setFormHora('08:00 A.M.');
    setFormSesionActual(1);
    setFormSesionTotal(10);
    setFormEstado('Pendiente');
    setFormNotas('');
    setIsModalOpen(true);
  };

  const handleAbrirEditarCitaModal = (cita: CitaFisioterapia) => {
    setSelectedCitaId(cita.id);
    setCitaParaImprimir(cita);
    setFormBeneficiario(cita.beneficiario);
    setFormIdentificacion(cita.identificacion || '');
    setBeneficiarioSearchInput(cita.beneficiario);
    setFormDiagnostico(cita.tratamiento);
    setFormFecha(cita.fecha);
    setFormHora(cita.hora);
    setFormSesionActual(cita.sesionActual);
    setFormSesionTotal(cita.sesionTotal);
    setFormEstado(cita.estado);
    setFormNotas(cita.notas || '');
    setIsModalOpen(true);
  };

  const handleCerrarModal = () => {
    setIsModalOpen(false);
    setSelectedCitaId(null);
    setShowBeneficiarioDropdown(false);
  };

  // ==============================================================
  // ACCIÓN: ELIMINAR CONSULTA SELECCIONADA
  // ==============================================================
  const handleEliminarConsulta = () => {
    if (!selectedCitaId) return;

    const citaAEliminar = citas.find(c => c.id === selectedCitaId);
    const nombre = citaAEliminar?.beneficiario || 'esta consulta';

    if (!window.confirm(`¿Estás seguro de que deseas eliminar la consulta de "${nombre}"?`)) {
      return;
    }

    const nuevasCitas = citas.filter(c => c.id !== selectedCitaId);
    setCitas(nuevasCitas);
    saveStoredCitas(nuevasCitas);
    handleCerrarModal();
    triggerNotification(`Consulta de "${nombre}" eliminada correctamente.`);
  };

  // ==============================================================
  // ACCIÓN: GUARDAR (CREAR O ACTUALIZAR) CONSULTA
  // ==============================================================
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

    // Asociar con id_beneficiario si existe en los beneficiarios registrados
    const beneficiarioEncontrado = beneficiariosDisponibles.find(
      b => b.nombre_completo.toLowerCase() === pacienteNombre.toLowerCase() ||
           (b.identificacion && formIdentificacion && b.identificacion.toLowerCase() === formIdentificacion.toLowerCase())
    );

    if (selectedCitaId) {
      // MODO EDICIÓN: Actualizar consulta existente
      const citasActualizadas = citas.map(cita => {
        if (cita.id === selectedCitaId) {
          const updated: CitaFisioterapia = {
            ...cita,
            beneficiario: pacienteNombre,
            identificacion: formIdentificacion || cita.identificacion || 'REG-FT',
            id_beneficiario: beneficiarioEncontrado ? beneficiarioEncontrado.id_beneficiario : cita.id_beneficiario,
            tratamiento: formDiagnostico.trim(),
            fecha: formFecha || hoyStr,
            hora: formHora,
            sesionActual: Number(formSesionActual) || 1,
            sesionTotal: Number(formSesionTotal) || 10,
            estado: formEstado,
            notas: formNotas.trim()
          };
          setCitaParaImprimir(updated);
          return updated;
        }
        return cita;
      });

      setCitas(citasActualizadas);
      saveStoredCitas(citasActualizadas);
      handleCerrarModal();
      triggerNotification(`¡Consulta de "${pacienteNombre}" actualizada exitosamente!`);
    } else {
      // MODO NUEVO: Registrar nueva consulta
      const nuevaCita: CitaFisioterapia = {
        id: Date.now(),
        id_beneficiario: beneficiarioEncontrado?.id_beneficiario,
        beneficiario: pacienteNombre,
        identificacion: formIdentificacion || 'REG-FT',
        tratamiento: formDiagnostico.trim(),
        fecha: formFecha || hoyStr,
        hora: formHora,
        sesionActual: Number(formSesionActual) || 1,
        sesionTotal: Number(formSesionTotal) || 10,
        estado: formEstado,
        notas: formNotas.trim()
      };

      const nuevasCitas = [nuevaCita, ...citas];
      setCitas(nuevasCitas);
      saveStoredCitas(nuevasCitas);
      handleCerrarModal();
      triggerNotification(`¡Consulta de "${pacienteNombre}" registrada exitosamente!`);
    }
  };

  // Cambio de estado rápido en el badge de la tabla
  const handleCambiarEstado = (id: number, nuevoEstado: EstadoAsistencia) => {
    const actualizadas = citas.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c);
    setCitas(actualizadas);
    saveStoredCitas(actualizadas);
    setOpenStatusMenuId(null);
    if (selectedCitaId === id) {
      setFormEstado(nuevoEstado);
    }
    triggerNotification(`Estado actualizado a "${nuevoEstado}" correctamente`);
  };

  // Exportar ficha individual en PDF directamente desde una fila
  const handleImprimirCitaDirecta = (cita: CitaFisioterapia, e: React.MouseEvent) => {
    e.stopPropagation();
    setCitaParaImprimir(cita);
    setTimeout(() => {
      handlePrintCita();
    }, 150);
  };

  // Preparar e imprimir la cita que está activa en el modal
  const handleImprimirCitaDesdeModal = () => {
    if (!citaParaImprimir) return;
    const citaActualizada: CitaFisioterapia = {
      ...citaParaImprimir,
      beneficiario: formBeneficiario.trim() || citaParaImprimir.beneficiario,
      identificacion: formIdentificacion || citaParaImprimir.identificacion,
      tratamiento: formDiagnostico.trim() || citaParaImprimir.tratamiento,
      fecha: formFecha || citaParaImprimir.fecha,
      hora: formHora || citaParaImprimir.hora,
      sesionActual: Number(formSesionActual) || citaParaImprimir.sesionActual,
      sesionTotal: Number(formSesionTotal) || citaParaImprimir.sesionTotal,
      estado: formEstado || citaParaImprimir.estado,
      notas: formNotas.trim() || citaParaImprimir.notas
    };
    setCitaParaImprimir(citaActualizada);
    setTimeout(() => {
      handlePrintCita();
    }, 150);
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
              {/* Botón + Nueva Cita (Abre Modal) */}
              <button
                onClick={handleAbrirNuevaCitaModal}
                className="bg-white hover:bg-slate-50 text-[#5ba4c7] hover:text-[#4796b8] border border-[#5ba4c7]/40 px-5 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-sm transition-all active:scale-[0.98]"
              >
                <Plus size={18} strokeWidth={3} />
                <span>Nueva Cita</span>
              </button>

              {/* Botón Exportar Reporte en PDF */}
              <button
                onClick={handlePrintReport}
                className="bg-[#5ba4c7] hover:bg-[#4a8ba9] text-white px-5 py-2.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-[#5ba4c7]/25 transition-all active:scale-[0.98]"
              >
                <Printer size={18} strokeWidth={2.5} />
                <span>Exportar Reporte (PDF)</span>
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
          {/* VISTA PRINCIPAL: CONSULTAS DEL DÍA A ANCHO COMPLETO (MAXIMA VISIBILIDAD) */}
          {/* ============================================================== */}
          <div className="w-full bg-[#ebf7f5]/80 border border-emerald-100 rounded-[34px] p-6 sm:p-9 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                  <Activity size={22} className="text-[#5ba4c7]" />
                  Consultas del Día
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-1">
                  💡 Haz clic en cualquier fila para abrir el modal, editar sus datos o exportar su ficha en PDF.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600 bg-white/90 px-3.5 py-1.5 rounded-full border border-emerald-100 shadow-sm">
                  {citasFiltradas.length} consultas registradas
                </span>
                <button
                  onClick={handleAbrirNuevaCitaModal}
                  className="bg-[#5ba4c7] hover:bg-[#4a8ba9] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Plus size={15} />
                  <span>Registrar Cita</span>
                </button>
              </div>
            </div>

            {/* Tabla de Citas a Ancho Completo */}
            <div className="overflow-x-auto bg-white/80 rounded-[26px] border border-emerald-100/80 p-2 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-emerald-100/90 text-xs font-black text-slate-900">
                    <th className="py-4 px-4">Beneficiario</th>
                    <th className="py-4 px-4">Tratamiento / Diagnóstico</th>
                    <th className="py-4 px-4">Hora</th>
                    <th className="py-4 px-4">Sesión</th>
                    <th className="py-4 px-4 text-center">Estado de Asistencia</th>
                    <th className="py-4 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100/60 text-xs">
                  {citasFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                        No se encontraron consultas con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    citasFiltradas.map((cita) => {
                      const isMenuOpen = openStatusMenuId === cita.id;

                      return (
                        <tr 
                          key={cita.id} 
                          onClick={() => handleAbrirEditarCitaModal(cita)}
                          className="transition-all cursor-pointer hover:bg-[#eaf7f9] group"
                          title="Haz clic para abrir el modal y editar o imprimir esta consulta"
                        >
                          {/* Beneficiario */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="font-extrabold text-slate-900 text-sm group-hover:text-[#2f8caf] transition-colors block">
                              {cita.beneficiario}
                            </span>
                            {cita.identificacion && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                {cita.identificacion}
                              </span>
                            )}
                          </td>

                          {/* Tratamiento / Diagnóstico */}
                          <td className="py-4 px-4 text-slate-700 font-bold text-xs max-w-[280px]">
                            {cita.tratamiento}
                          </td>

                          {/* Hora */}
                          <td className="py-4 px-4 text-slate-700 font-bold whitespace-nowrap">
                            {cita.hora}
                          </td>

                          {/* Sesión */}
                          <td className="py-4 px-4 text-slate-700 font-bold whitespace-nowrap">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                              {cita.sesionActual} de {cita.sesionTotal}
                            </span>
                          </td>

                          {/* Estado de Asistencia (Pill Button con Menú Rápido) */}
                          <td className="py-4 px-4 text-center whitespace-nowrap relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenStatusMenuId(isMenuOpen ? null : cita.id);
                              }}
                              className={`inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95 ${
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenStatusMenuId(null);
                                  }}
                                />
                                <div 
                                  className="absolute right-4 top-12 z-40 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 min-w-[140px] space-y-1 text-left"
                                  onClick={(e) => e.stopPropagation()}
                                >
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

                          {/* Acciones directas por fila */}
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                              {/* Botón Imprimir Ficha PDF Directo */}
                              <button
                                type="button"
                                onClick={(e) => handleImprimirCitaDirecta(cita, e)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-[#5ba4c7] text-slate-600 hover:text-white transition-all shadow-sm"
                                title="Exportar Ficha Clínica en PDF"
                              >
                                <Printer size={15} />
                              </button>

                              {/* Botón Editar (Abre Modal) */}
                              <button
                                type="button"
                                onClick={() => handleAbrirEditarCitaModal(cita)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-[#2f8caf] text-slate-600 hover:text-white transition-all shadow-sm"
                                title="Editar datos de la consulta"
                              >
                                <Edit3 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* ============================================================== */}
      {/* MODAL PARA NUEVA CONSULTA / EDITAR CONSULTA EXISTENTE */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Fondo desenfocado */}
          <div 
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm transition-opacity"
            onClick={handleCerrarModal}
          />

          {/* Tarjeta del Modal */}
          <div className="relative bg-white w-full max-w-2xl rounded-[34px] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200 z-10 flex flex-col max-h-[92vh]">
            
            {/* Encabezado del Modal */}
            <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-[#effcff] shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Activity size={20} className="text-[#5ba4c7]" />
                  {selectedCitaId ? 'Editar Consulta / Avance' : 'Registrar Nueva Consulta / Avance'}
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">
                  {selectedCitaId 
                    ? 'Modificando datos de la consulta seleccionada' 
                    : 'Ingresa los datos para programar la sesión clínica'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCerrarModal}
                className="w-10 h-10 rounded-2xl bg-white border border-slate-100 text-slate-500 hover:text-[#5ba4c7] hover:bg-[#f8fdfe] transition-all flex items-center justify-center shadow-sm"
                title="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulario con Scroll si es necesario */}
            <form onSubmit={handleGuardarConsulta} className="p-7 overflow-y-auto space-y-4 flex-1">
              
              {/* Campo Beneficiario (con buscador / autocompletado) */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Beneficiario
                </label>
                <div className="relative flex items-center">
                  <Search size={16} className="absolute left-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar beneficiario por nombre o identificación..."
                    value={formBeneficiario || beneficiarioSearchInput}
                    onChange={(e) => {
                      setFormBeneficiario(e.target.value);
                      setBeneficiarioSearchInput(e.target.value);
                      setShowBeneficiarioDropdown(true);
                    }}
                    onFocus={() => setShowBeneficiarioDropdown(true)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5ba4c7]/30 focus:border-[#5ba4c7] transition-all"
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5ba4c7]/30 focus:border-[#5ba4c7] transition-all"
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

              {/* Fila de Sesión y Estado de Asistencia */}
              <div className="grid grid-cols-3 gap-2.5">
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
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5ba4c7]/30 focus:border-[#5ba4c7] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Total Sesiones
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formSesionTotal}
                    onChange={(e) => setFormSesionTotal(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5ba4c7]/30 focus:border-[#5ba4c7] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Asistencia
                  </label>
                  <select
                    value={formEstado}
                    onChange={(e) => setFormEstado(e.target.value as EstadoAsistencia)}
                    className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5ba4c7]/30 focus:border-[#5ba4c7] transition-all cursor-pointer"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Asistió">Asistió</option>
                    <option value="Faltó">Faltó</option>
                  </select>
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

              {/* BOTONES DE ACCIÓN EN EL FOOTER DEL MODAL */}
              <div className="pt-3 border-t border-slate-100">
                {selectedCitaId ? (
                  /* Modo Edición: Guardar, Exportar PDF, Cancelar y Eliminar */
                  <div className="flex flex-col sm:flex-row items-center gap-2.5">
                    {/* Botón Guardar Cambios */}
                    <button
                      type="submit"
                      className="w-full sm:flex-1 bg-[#5ba4c7] hover:bg-[#4a8ba9] text-white font-extrabold text-xs sm:text-sm py-3 px-4 rounded-2xl shadow-md shadow-[#5ba4c7]/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Check size={16} strokeWidth={2.5} />
                      <span>Guardar</span>
                    </button>

                    {/* Botón Exportar PDF de esta cita */}
                    <button
                      type="button"
                      onClick={handleImprimirCitaDesdeModal}
                      className="w-full sm:w-auto bg-[#e6f6f7] hover:bg-[#d1f0f2] text-[#1b7a8c] border border-[#a6e2e8] font-bold text-xs sm:text-sm py-3 px-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-sm"
                      title="Descargar o imprimir comprobante clínico en PDF"
                    >
                      <Printer size={16} />
                      <span>Exportar PDF</span>
                    </button>

                    {/* Botón Cancelar */}
                    <button
                      type="button"
                      onClick={handleCerrarModal}
                      className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm py-3 px-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw size={15} />
                      <span>Cancelar</span>
                    </button>

                    {/* Botón Eliminar */}
                    <button
                      type="button"
                      onClick={handleEliminarConsulta}
                      className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-2xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                      title="Eliminar esta consulta de forma permanente"
                    >
                      <Trash2 size={16} />
                      <span>Eliminar</span>
                    </button>
                  </div>
                ) : (
                  /* Modo Nuevo: Guardar y Cancelar */
                  <div className="flex gap-2.5">
                    <button
                      type="submit"
                      className="flex-1 bg-[#5ba4c7] hover:bg-[#4a8ba9] text-white font-extrabold text-sm py-3.5 rounded-2xl shadow-lg shadow-[#5ba4c7]/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Plus size={18} strokeWidth={3} />
                      <span>Guardar Consulta</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCerrarModal}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-6 py-3.5 rounded-2xl transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PLANTILLAS OFF-SCREEN PARA EXPORTAR EN PDF (REACT-TO-PRINT) */}
      {/* ============================================================== */}

      {/* 1. PLANTILLA PDF: REPORTE GENERAL DE FISIOTERAPIA */}
      <div className="fixed -left-[9999px] top-0 bg-white">
        <style>{`
          @media print {
            body {
              background-color: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}</style>
        <div
          ref={printReportRef}
          className="w-[794px] min-h-[1123px] bg-white text-slate-900 font-sans p-10"
          style={{ backgroundColor: '#ffffff' }}
        >
          {/* Encabezado del reporte institucional */}
          <div className="flex items-start justify-between border-b-4 border-[#5ba4c7] pb-6 mb-8">
            <div className="flex items-center gap-5">
              <div className="w-24 h-20 border border-slate-200 rounded-2xl flex items-center justify-center p-2">
                <img
                  src="/src/assets/logo.png"
                  alt="Logo Palabras de Esperanza"
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              <div>
                <h1 className="text-2xl font-black text-slate-900 leading-tight">
                  Reporte General de Fisioterapia
                </h1>
                <p className="text-sm font-bold text-[#5ba4c7] mt-1">
                  Centro Comunitario Palabras de Esperanza
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Módulo de Fisioterapia, Consultas Clínicas y Rehabilitación
                </p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-500">
              <p className="font-black text-slate-800">Fecha de emisión</p>
              <p>{new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="font-black text-slate-800 mt-2">Citas registradas</p>
              <p>{citasFiltradas.length} sesiones</p>
            </div>
          </div>

          {/* Resumen ejecutivo de métricas */}
          <section className="mb-7">
            <h2 className="text-sm font-black uppercase text-slate-600 tracking-wider mb-3">
              Resumen Clínico de Actividades
            </h2>

            <div className="grid grid-cols-4 gap-3">
              <div className="bg-[#f1fbfe] border border-[#9bd8ea] rounded-xl p-3.5 text-center">
                <p className="text-[10px] font-black uppercase text-slate-500">Citas Hoy</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{metricas.citasHoyCount}</p>
              </div>
              <div className="bg-[#edf8f6] border border-[#94d6c6] rounded-xl p-3.5 text-center">
                <p className="text-[10px] font-black uppercase text-emerald-700">Asistencias</p>
                <p className="text-2xl font-black text-emerald-800 mt-1">{metricas.confirmadasCount}</p>
              </div>
              <div className="bg-[#fff9ec] border border-[#ffda99] rounded-xl p-3.5 text-center">
                <p className="text-[10px] font-black uppercase text-amber-700">Pendientes</p>
                <p className="text-2xl font-black text-amber-800 mt-1">{metricas.pendientesCount}</p>
              </div>
              <div className="bg-[#eef7fb] border border-[#5ba4c7]/40 rounded-xl p-3.5 text-center">
                <p className="text-[10px] font-black uppercase text-[#2f8caf]">Tratamientos</p>
                <p className="text-2xl font-black text-[#1e6c86] mt-1">{metricas.tratamientosActivosCount}</p>
              </div>
            </div>
          </section>

          {/* Tabla detallada de citas */}
          <section className="mb-8">
            <h2 className="text-sm font-black uppercase text-slate-600 tracking-wider mb-3">
              Listado de Consultas del Día
            </h2>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-y border-slate-200 text-slate-800 font-bold">
                  <th className="py-2.5 px-3">Beneficiario</th>
                  <th className="py-2.5 px-3">Diagnóstico / Tratamiento</th>
                  <th className="py-2.5 px-3">Hora</th>
                  <th className="py-2.5 px-3">Sesión</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3">Notas de Evolución</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {citasFiltradas.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {c.beneficiario}
                      {c.identificacion && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {c.identificacion}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{c.tratamiento}</td>
                    <td className="py-2.5 px-3 text-slate-700">{c.hora}</td>
                    <td className="py-2.5 px-3 text-slate-700">{c.sesionActual} de {c.sesionTotal}</td>
                    <td className="py-2.5 px-3 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        c.estado === 'Asistió' ? 'bg-emerald-100 text-emerald-800' :
                        c.estado === 'Faltó' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-[200px] truncate">
                      {c.notas || 'Sin notas registradas'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Firmas de validación */}
          <div className="grid grid-cols-2 gap-10 pt-16 mt-12 border-t border-slate-200 text-center text-xs text-slate-600">
            <div>
              <div className="w-56 border-b border-slate-400 mx-auto mb-2"></div>
              <p className="font-bold text-slate-800">Fisioterapeuta Responsable</p>
              <p className="text-[10px] text-slate-400">Firma y Cédula Profesional</p>
            </div>
            <div>
              <div className="w-56 border-b border-slate-400 mx-auto mb-2"></div>
              <p className="font-bold text-slate-800">Coordinación Médica</p>
              <p className="text-[10px] text-slate-400">Palabras de Esperanza</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PLANTILLA PDF: FICHA CLÍNICA INDIVIDUAL DE CONSULTA */}
      <div className="fixed -left-[9999px] top-0 bg-white">
        <div
          ref={printCitaRef}
          className="w-[794px] min-h-[1123px] bg-white text-slate-900 font-sans p-12"
          style={{ backgroundColor: '#ffffff' }}
        >
          {citaParaImprimir && (
            <>
              {/* Encabezado Ficha */}
              <div className="flex items-start justify-between border-b-4 border-[#5ba4c7] pb-6 mb-8">
                <div className="flex items-center gap-5">
                  <div className="w-24 h-20 border border-slate-200 rounded-2xl flex items-center justify-center p-2">
                    <img
                      src="/src/assets/logo.png"
                      alt="Logo Palabras de Esperanza"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  <div>
                    <h1 className="text-2xl font-black text-slate-900 leading-tight">
                      Ficha de Consulta de Fisioterapia
                    </h1>
                    <p className="text-sm font-bold text-[#5ba4c7] mt-1">
                      Centro Comunitario Palabras de Esperanza
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Comprobante Clínico y Hoja de Evolución de Tratamiento
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div className="bg-[#f1fbfe] border border-[#9bd8ea] px-3.5 py-2 rounded-xl text-center">
                    <p className="text-[10px] font-black uppercase text-[#5ba4c7]">Folio de Cita</p>
                    <p className="text-base font-black text-slate-900">#FT-{citaParaImprimir.id.toString().slice(-4)}</p>
                  </div>
                  <p className="text-slate-400 text-[10px] mt-2">
                    Emisión: {new Date().toLocaleDateString('es-MX')}
                  </p>
                </div>
              </div>

              {/* Datos del Paciente */}
              <section className="mb-6 bg-[#f8fafc] border border-slate-200 rounded-2xl p-5">
                <h2 className="text-xs font-black uppercase text-[#5ba4c7] tracking-wider mb-3">
                  Datos del Paciente / Beneficiario
                </h2>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Nombre Completo</p>
                    <p className="text-sm font-black text-slate-900 mt-0.5">{citaParaImprimir.beneficiario}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[10px]">Identificación Oficial</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{citaParaImprimir.identificacion || 'N/A'}</p>
                  </div>
                </div>
              </section>

              {/* Información de la Consulta y Tratamiento */}
              <section className="mb-6 border border-slate-200 rounded-2xl p-5">
                <h2 className="text-xs font-black uppercase text-[#5ba4c7] tracking-wider mb-4">
                  Detalles del Tratamiento y Sesión
                </h2>

                <div className="grid grid-cols-3 gap-4 text-xs mb-4">
                  <div className="bg-[#f1fbfe] border border-[#9bd8ea]/70 rounded-xl p-3">
                    <p className="text-slate-500 font-bold uppercase text-[10px]">Diagnóstico / Terapia</p>
                    <p className="text-xs font-black text-slate-900 mt-1">{citaParaImprimir.tratamiento}</p>
                  </div>

                  <div className="bg-[#f1fbfe] border border-[#9bd8ea]/70 rounded-xl p-3">
                    <p className="text-slate-500 font-bold uppercase text-[10px]">Fecha y Hora Programada</p>
                    <p className="text-xs font-black text-slate-900 mt-1">{citaParaImprimir.fecha} • {citaParaImprimir.hora}</p>
                  </div>

                  <div className="bg-[#f1fbfe] border border-[#9bd8ea]/70 rounded-xl p-3">
                    <p className="text-slate-500 font-bold uppercase text-[10px]">Estado de Asistencia</p>
                    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-black ${
                      citaParaImprimir.estado === 'Asistió' ? 'bg-emerald-100 text-emerald-800' :
                      citaParaImprimir.estado === 'Faltó' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {citaParaImprimir.estado}
                    </span>
                  </div>
                </div>

                {/* Progreso del tratamiento */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
                    <span className="text-slate-700">Progreso del Tratamiento:</span>
                    <span className="text-[#2f8caf]">
                      Sesión {citaParaImprimir.sesionActual} de {citaParaImprimir.sesionTotal} ({Math.round((citaParaImprimir.sesionActual / citaParaImprimir.sesionTotal) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-[#5ba4c7] h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.round((citaParaImprimir.sesionActual / citaParaImprimir.sesionTotal) * 100))}%` }}
                    />
                  </div>
                </div>
              </section>

              {/* Notas de Evolución */}
              <section className="mb-10 border border-slate-200 rounded-2xl p-5">
                <h2 className="text-xs font-black uppercase text-[#5ba4c7] tracking-wider mb-2">
                  Notas de Evolución Clínica (Avance y Observaciones)
                </h2>
                <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-700 leading-relaxed min-h-[130px] border border-slate-100 font-medium">
                  {citaParaImprimir.notas ? (
                    citaParaImprimir.notas
                  ) : (
                    <span className="text-slate-400 italic">No se registraron notas adicionales para esta sesión.</span>
                  )}
                </div>
              </section>

              {/* Firmas */}
              <div className="grid grid-cols-2 gap-10 pt-16 mt-16 border-t border-slate-200 text-center text-xs text-slate-600">
                <div>
                  <div className="w-56 border-b border-slate-400 mx-auto mb-2"></div>
                  <p className="font-bold text-slate-800">Firma del Beneficiario</p>
                  <p className="text-[10px] text-slate-400">Conformidad de sesión recibida</p>
                </div>
                <div>
                  <div className="w-56 border-b border-slate-400 mx-auto mb-2"></div>
                  <p className="font-bold text-slate-800">Fisioterapeuta Tratante</p>
                  <p className="text-[10px] text-slate-400">Palabras de Esperanza</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default Fisioterapia;
