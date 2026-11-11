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

// Semilla inicial enriquecida y vinculada a los beneficiarios del sistema
export const INITIAL_CITAS: CitaFisioterapia[] = [
  {
    id: 1,
    id_beneficiario: 4,
    beneficiario: 'Ricardo Rocha',
    identificacion: 'RORR800101HDFRRN01',
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
    id_beneficiario: 4,
    beneficiario: 'Ricardo Rocha',
    identificacion: 'RORR800101HDFRRN01',
    tratamiento: 'Terapia de hombro',
    fecha: new Date().toISOString().split('T')[0],
    hora: '08:30 A.M.',
    sesionActual: 2,
    sesionTotal: 10,
    estado: 'Faltó',
    notas: 'Paciente no se presentó a su sesión programada sin previo aviso.'
  },
  {
    id: 3,
    id_beneficiario: 2,
    beneficiario: 'Carlos Villalobos',
    identificacion: 'VILC920310HJCNSL05',
    tratamiento: 'Terapia de hombro',
    fecha: new Date().toISOString().split('T')[0],
    hora: '07:30 A.M.',
    sesionActual: 3,
    sesionTotal: 10,
    estado: 'Asistió',
    notas: 'Sesión enfocada en manguito rotador y crioterapia analgésica.'
  },
  {
    id: 4,
    id_beneficiario: 2,
    beneficiario: 'Carlos Villalobos',
    identificacion: 'VILC920310HJCNSL05',
    tratamiento: 'Terapia de hombro',
    fecha: new Date().toISOString().split('T')[0],
    hora: '07:30 A.M.',
    sesionActual: 2,
    sesionTotal: 10,
    estado: 'Asistió',
    notas: 'Excelente respuesta al estiramiento activo asistido.'
  },
  {
    id: 5,
    id_beneficiario: 2,
    beneficiario: 'Carlos Villalobos',
    identificacion: 'VILC920310HJCNSL05',
    tratamiento: 'Terapia de hombro',
    fecha: new Date().toISOString().split('T')[0],
    hora: '07:30 A.M.',
    sesionActual: 1,
    sesionTotal: 10,
    estado: 'Asistió',
    notas: 'Evaluación inicial del arco de movimiento y diseño de rutina muscular.'
  },
  {
    id: 6,
    id_beneficiario: 3,
    beneficiario: 'Lucía Méndez',
    identificacion: 'MELP781125MDFRRN09',
    tratamiento: 'Fortalecimiento de tobillo',
    fecha: new Date().toISOString().split('T')[0],
    hora: '09:00 A.M.',
    sesionActual: 4,
    sesionTotal: 8,
    estado: 'Asistió',
    notas: 'Reeducación de la marcha en barras paralelas sin apoyo auxiliar.'
  },
  {
    id: 7,
    id_beneficiario: 1,
    beneficiario: 'Mariana Estrada',
    identificacion: 'EASM850614HDFRRN02',
    tratamiento: 'Terapia de columna lumbar',
    fecha: new Date().toISOString().split('T')[0],
    hora: '10:30 A.M.',
    sesionActual: 2,
    sesionTotal: 10,
    estado: 'Pendiente',
    notas: 'Aplicación de calor local y ejercicios Williams para lumbalgia.'
  },
  {
    id: 8,
    id_beneficiario: 5,
    beneficiario: 'Elena Guajardo',
    identificacion: 'GUGE880512MDFRRN04',
    tratamiento: 'Rehabilitación de muñeca y mano',
    fecha: new Date().toISOString().split('T')[0],
    hora: '11:30 A.M.',
    sesionActual: 5,
    sesionTotal: 12,
    estado: 'Asistió',
    notas: 'Ejercicios de prensión y movilidad articular con plastilina terapéutica.'
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

