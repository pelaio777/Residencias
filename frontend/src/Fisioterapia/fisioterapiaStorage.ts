// frontend/src/Fisioterapia/fisioterapiaStorage.ts

export type EstadoAsistencia = 'Asistió' | 'Faltó' | 'Pendiente';

export interface CitaFisioterapia {
  id: number;
  id_beneficiario?: number;
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

export const FISIOTERAPIA_STORAGE_KEY = 'citas_fisioterapia_db';
export const EVENT_FISIOTERAPIA_UPDATED = 'fisioterapia_updated';

// Helper para calcular fechas relativas a hoy (YYYY-MM-DD)
export const getRelativeDate = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Semilla inicial enriquecida distribuida en distintas fechas (Agenda clínica realista)
export const INITIAL_CITAS: CitaFisioterapia[] = [
  // --- CITAS DE HOY ---
  {
    id: 1,
    id_beneficiario: 4,
    beneficiario: 'Ricardo Rocha',
    identificacion: 'RORR800101HDFRRN01',
    tratamiento: 'Rehabilitación de rodilla',
    fecha: getRelativeDate(0), // HOY
    hora: '07:30 A.M.',
    sesionActual: 3,
    sesionTotal: 10,
    estado: 'Asistió',
    notas: 'Mejoría notable en flexión y extensión. Realizó ejercicios con banda elástica.'
  },
  {
    id: 2,
    id_beneficiario: 2,
    beneficiario: 'Carlos Villalobos',
    identificacion: 'VILC920310HJCNSL05',
    tratamiento: 'Terapia de hombro',
    fecha: getRelativeDate(0), // HOY
    hora: '08:30 A.M.',
    sesionActual: 3,
    sesionTotal: 10,
    estado: 'Asistió',
    notas: 'Sesión enfocada en manguito rotador y crioterapia analgésica.'
  },
  {
    id: 3,
    id_beneficiario: 3,
    beneficiario: 'Lucía Méndez',
    identificacion: 'MELP781125MDFRRN09',
    tratamiento: 'Fortalecimiento de tobillo',
    fecha: getRelativeDate(0), // HOY
    hora: '09:00 A.M.',
    sesionActual: 4,
    sesionTotal: 8,
    estado: 'Asistió',
    notas: 'Reeducación de la marcha en barras paralelas sin apoyo auxiliar.'
  },
  {
    id: 4,
    id_beneficiario: 1,
    beneficiario: 'Mariana Estrada',
    identificacion: 'EASM850614HDFRRN02',
    tratamiento: 'Terapia de columna lumbar',
    fecha: getRelativeDate(0), // HOY
    hora: '10:30 A.M.',
    sesionActual: 2,
    sesionTotal: 10,
    estado: 'Pendiente',
    notas: 'Aplicación de calor local y ejercicios Williams para lumbalgia.'
  },
  {
    id: 5,
    id_beneficiario: 5,
    beneficiario: 'Elena Guajardo',
    identificacion: 'GUGE880512MDFRRN04',
    tratamiento: 'Rehabilitación de muñeca y mano',
    fecha: getRelativeDate(0), // HOY
    hora: '11:30 A.M.',
    sesionActual: 5,
    sesionTotal: 12,
    estado: 'Pendiente',
    notas: 'Ejercicios de prensión y movilidad articular con plastilina terapéutica.'
  },

  // --- CITAS DE MAÑANA ---
  {
    id: 6,
    id_beneficiario: 4,
    beneficiario: 'Ricardo Rocha',
    identificacion: 'RORR800101HDFRRN01',
    tratamiento: 'Terapia de hombro y espalda',
    fecha: getRelativeDate(1), // MAÑANA
    hora: '08:00 A.M.',
    sesionActual: 4,
    sesionTotal: 10,
    estado: 'Pendiente',
    notas: 'Seguimiento de fortalecimiento del dorsal y manguito rotador.'
  },
  {
    id: 7,
    id_beneficiario: 2,
    beneficiario: 'Carlos Villalobos',
    identificacion: 'VILC920310HJCNSL05',
    tratamiento: 'Mecanoterapia y estiramientos',
    fecha: getRelativeDate(1), // MAÑANA
    hora: '09:30 A.M.',
    sesionActual: 4,
    sesionTotal: 10,
    estado: 'Pendiente',
    notas: 'Continuación del protocolo de movilidad pasiva asistida.'
  },

  // --- CITAS DE AYER ---
  {
    id: 8,
    id_beneficiario: 4,
    beneficiario: 'Ricardo Rocha',
    identificacion: 'RORR800101HDFRRN01',
    tratamiento: 'Terapia de hombro',
    fecha: getRelativeDate(-1), // AYER
    hora: '08:30 A.M.',
    sesionActual: 2,
    sesionTotal: 10,
    estado: 'Faltó',
    notas: 'Paciente no se presentó a su sesión programada sin previo aviso.'
  },
  {
    id: 9,
    id_beneficiario: 2,
    beneficiario: 'Carlos Villalobos',
    identificacion: 'VILC920310HJCNSL05',
    tratamiento: 'Terapia de hombro',
    fecha: getRelativeDate(-1), // AYER
    hora: '07:30 A.M.',
    sesionActual: 2,
    sesionTotal: 10,
    estado: 'Asistió',
    notas: 'Excelente respuesta al estiramiento activo asistido.'
  },
  {
    id: 10,
    id_beneficiario: 3,
    beneficiario: 'Lucía Méndez',
    identificacion: 'MELP781125MDFRRN09',
    tratamiento: 'Fisioterapia de marcha',
    fecha: getRelativeDate(-1), // AYER
    hora: '10:00 A.M.',
    sesionActual: 3,
    sesionTotal: 8,
    estado: 'Asistió',
    notas: 'Ejercicios de propiocepción sobre colchoneta y plato de Freeman.'
  },

  // --- CITAS EN 2 DÍAS ---
  {
    id: 11,
    id_beneficiario: 5,
    beneficiario: 'Elena Guajardo',
    identificacion: 'GUGE880512MDFRRN04',
    tratamiento: 'Terapia ocupacional y motricidad',
    fecha: getRelativeDate(2),
    hora: '11:00 A.M.',
    sesionActual: 6,
    sesionTotal: 12,
    estado: 'Pendiente',
    notas: 'Entrenamiento funcional de actividades de la vida diaria.'
  }
];

export const getStoredCitas = (): CitaFisioterapia[] => {
  try {
    const raw = localStorage.getItem(FISIOTERAPIA_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(FISIOTERAPIA_STORAGE_KEY, JSON.stringify(INITIAL_CITAS));
      return INITIAL_CITAS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Si todas las citas tenían una misma fecha antigua fija, refrescar con fechas relativas
      const todayStr = getRelativeDate(0);
      const uniqueDates = new Set(parsed.map((c: CitaFisioterapia) => c.fecha));
      if (uniqueDates.size <= 2 && !uniqueDates.has(todayStr)) {
        localStorage.setItem(FISIOTERAPIA_STORAGE_KEY, JSON.stringify(INITIAL_CITAS));
        return INITIAL_CITAS;
      }
      return parsed;
    }
    return INITIAL_CITAS;
  } catch (error) {
    console.error('Error al leer citas de fisioterapia:', error);
    return INITIAL_CITAS;
  }
};

export const saveStoredCitas = (citas: CitaFisioterapia[]): void => {
  try {
    localStorage.setItem(FISIOTERAPIA_STORAGE_KEY, JSON.stringify(citas));
    window.dispatchEvent(new CustomEvent(EVENT_FISIOTERAPIA_UPDATED, { detail: citas }));
  } catch (error) {
    console.error('Error al guardar citas de fisioterapia:', error);
  }
};

export const getCitasByBeneficiario = (
  beneficiarioId?: number,
  identificacion?: string,
  nombreCompleto?: string
): CitaFisioterapia[] => {
  const todas = getStoredCitas();
  const idStr = identificacion?.trim().toLowerCase();
  const nomStr = nombreCompleto?.trim().toLowerCase();

  return todas.filter(c => {
    if (beneficiarioId && c.id_beneficiario && c.id_beneficiario === beneficiarioId) {
      return true;
    }
    if (idStr && c.identificacion && c.identificacion.trim().toLowerCase() === idStr) {
      return true;
    }
    if (nomStr && c.beneficiario && c.beneficiario.trim().toLowerCase() === nomStr) {
      return true;
    }
    return false;
  });
};

