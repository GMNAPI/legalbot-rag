/**
 * Evaluation dataset with test cases
 * 
 * This dataset contains cases for:
 * - LAU (Ley de Arrendamientos Urbanos): Spanish rental law
 * - LPH (Ley de Propiedad Horizontal): Spanish horizontal property law
 * - Refusal cases: Questions outside the scope
 * - Ambiguous cases: Edge cases that might be tricky
 */

import type { EvaluationCase } from './types.js';

/**
 * LAU (Rental Law) test cases
 */
const lauCases: EvaluationCase[] = [
  {
    id: 'LAU-001',
    question: '¿Cuál es la duración mínima de un contrato de arrendamiento de vivienda?',
    expectedCitations: ['Artículo 9, LAU'],
    shouldRefuse: false,
    tags: ['LAU', 'rental', 'duration', 'contract'],
    metadata: {
      expectedKeywords: ['5 años', 'duración', 'mínima'],
      notes: 'Basic LAU question about minimum rental duration'
    }
  },
  {
    id: 'LAU-002',
    question: '¿Cuáles son las causas de extinción de un contrato de arrendamiento?',
    expectedCitations: ['Artículo 27, LAU'],
    shouldRefuse: false,
    tags: ['LAU', 'rental', 'termination', 'extinction'],
    metadata: {
      expectedKeywords: ['extinción', 'causas', 'arrendamiento'],
      notes: 'Question about rental contract termination'
    }
  },
  {
    id: 'LAU-003',
    question: '¿Quién es responsable de las reparaciones en una vivienda arrendada?',
    expectedCitations: ['Artículo 21, LAU'],
    shouldRefuse: false,
    tags: ['LAU', 'rental', 'repairs', 'obligations'],
    metadata: {
      expectedKeywords: ['reparaciones', 'arrendador', 'conservación'],
      notes: 'Question about repair responsibilities'
    }
  },
  {
    id: 'LAU-004',
    question: '¿Se puede prorrogar un contrato de arrendamiento de vivienda?',
    expectedCitations: ['Artículo 9, LAU', 'Artículo 10, LAU'],
    shouldRefuse: false,
    tags: ['LAU', 'rental', 'extension', 'prórroga'],
    metadata: {
      expectedKeywords: ['prórroga', 'anual', 'tres años'],
      notes: 'Question about rental contract extensions'
    }
  },
  {
    id: 'LAU-005',
    question: '¿Puede el arrendador actualizar la renta durante el contrato?',
    expectedCitations: ['Artículo 18, LAU'],
    shouldRefuse: false,
    tags: ['LAU', 'rental', 'rent', 'update', 'IPC'],
    metadata: {
      expectedKeywords: ['renta', 'actualización', 'IPC'],
      notes: 'Question about rent updates'
    }
  },
  {
    id: 'LAU-006',
    question: '¿Qué requisitos debe cumplir el desistimiento del arrendatario?',
    expectedCitations: ['Artículo 11, LAU'],
    shouldRefuse: false,
    tags: ['LAU', 'rental', 'termination', 'tenant'],
    metadata: {
      expectedKeywords: ['desistimiento', 'arrendatario', 'preaviso'],
      notes: 'Question about tenant withdrawal rights'
    }
  },
  {
    id: 'LAU-007',
    question: '¿Cuál es el plazo para devolver la fianza al finalizar el contrato?',
    expectedCitations: ['Artículo 36, LAU'],
    shouldRefuse: false,
    tags: ['LAU', 'rental', 'deposit', 'fianza'],
    metadata: {
      expectedKeywords: ['fianza', 'devolución', 'mes'],
      notes: 'Question about deposit return deadlines'
    }
  }
];

/**
 * LPH (Horizontal Property Law) test cases
 */
const lphCases: EvaluationCase[] = [
  {
    id: 'LPH-001',
    question: '¿Qué es un elemento común en una comunidad de propietarios?',
    expectedCitations: ['Artículo 3, LPH'],
    shouldRefuse: false,
    tags: ['LPH', 'community', 'common-areas'],
    metadata: {
      expectedKeywords: ['elementos comunes', 'portal', 'escalera'],
      notes: 'Question about common elements in horizontal property'
    }
  },
  {
    id: 'LPH-002',
    question: '¿Cuáles son las obligaciones de los propietarios en una comunidad?',
    expectedCitations: ['Artículo 9, LPH'],
    shouldRefuse: false,
    tags: ['LPH', 'community', 'obligations'],
    metadata: {
      expectedKeywords: ['obligaciones', 'propietarios', 'gastos'],
      notes: 'Question about owner obligations'
    }
  },
  {
    id: 'LPH-003',
    question: '¿Cómo se convocan las juntas de propietarios?',
    expectedCitations: ['Artículo 16, LPH'],
    shouldRefuse: false,
    tags: ['LPH', 'community', 'meeting', 'junta'],
    metadata: {
      expectedKeywords: ['junta', 'convocatoria', 'propietarios'],
      notes: 'Question about community meetings'
    }
  },
  {
    id: 'LPH-004',
    question: '¿Qué mayorías se necesitan para aprobar las decisiones de la comunidad?',
    expectedCitations: ['Artículo 17, LPH'],
    shouldRefuse: false,
    tags: ['LPH', 'community', 'voting', 'majority'],
    metadata: {
      expectedKeywords: ['mayoría', 'acuerdos', 'votos'],
      notes: 'Question about voting majorities'
    }
  }
];

/**
 * Refusal cases - Questions outside the scope
 */
const refusalCases: EvaluationCase[] = [
  {
    id: 'REFUSAL-001',
    question: '¿Cuál es el mejor restaurante en Madrid?',
    expectedCitations: [],
    shouldRefuse: true,
    tags: ['refusal', 'out-of-scope'],
    metadata: {
      notes: 'Completely unrelated to real estate law'
    }
  },
  {
    id: 'REFUSAL-002',
    question: '¿Cómo se hace una paella valenciana?',
    expectedCitations: [],
    shouldRefuse: true,
    tags: ['refusal', 'out-of-scope'],
    metadata: {
      notes: 'Cooking question - out of scope'
    }
  },
  {
    id: 'REFUSAL-003',
    question: '¿Qué dice el código penal sobre el robo?',
    expectedCitations: [],
    shouldRefuse: true,
    tags: ['refusal', 'out-of-scope', 'criminal-law'],
    metadata: {
      notes: 'Criminal law - not real estate law'
    }
  },
  {
    id: 'REFUSAL-004',
    question: '¿Cuánto cuesta comprar un piso en Barcelona?',
    expectedCitations: [],
    shouldRefuse: true,
    tags: ['refusal', 'out-of-scope', 'market-prices'],
    metadata: {
      notes: 'Market prices - outside legal scope'
    }
  },
  {
    id: 'REFUSAL-005',
    question: '¿Cómo puedo conseguir un préstamo hipotecario?',
    expectedCitations: [],
    shouldRefuse: true,
    tags: ['refusal', 'out-of-scope', 'financial'],
    metadata: {
      notes: 'Banking/financial question - out of scope'
    }
  }
];

/**
 * Ambiguous cases - Edge cases that might be tricky
 */
const ambiguousCases: EvaluationCase[] = [
  {
    id: 'AMBIGUOUS-001',
    question: '¿Qué pasa si no pago el alquiler?',
    expectedCitations: ['Artículo 27, LAU'],
    shouldRefuse: false,
    tags: ['LAU', 'rental', 'ambiguous', 'payment'],
    metadata: {
      expectedKeywords: ['falta de pago', 'extinción', 'desahucio'],
      notes: 'Informal phrasing - should still find relevant info'
    }
  },
  {
    id: 'AMBIGUOUS-002',
    question: 'Tengo un problema con mi vecino por ruidos, ¿qué puedo hacer?',
    expectedCitations: ['Artículo 7, LPH'],
    shouldRefuse: false,
    tags: ['LPH', 'community', 'ambiguous', 'disputes'],
    metadata: {
      expectedKeywords: ['convivencia', 'inmisiones'],
      notes: 'Vague question about neighbor disputes'
    }
  },
  {
    id: 'AMBIGUOUS-003',
    question: '¿Cuánto tiempo tengo que estar en un alquiler?',
    expectedCitations: ['Artículo 9, LAU'],
    shouldRefuse: false,
    tags: ['LAU', 'rental', 'ambiguous', 'duration'],
    metadata: {
      expectedKeywords: ['duración', '5 años', 'mínima'],
      notes: 'Informal question about rental duration'
    }
  }
];

/**
 * Complete evaluation dataset
 */
export const evaluationDataset: EvaluationCase[] = [
  ...lauCases,
  ...lphCases,
  ...refusalCases,
  ...ambiguousCases
];

/**
 * Get cases filtered by tags
 */
export function getCasesByTags(tags: string[]): EvaluationCase[] {
  return evaluationDataset.filter(testCase =>
    tags.some(tag => testCase.tags.includes(tag))
  );
}

/**
 * Get a single case by ID
 */
export function getCaseById(id: string): EvaluationCase | undefined {
  return evaluationDataset.find(testCase => testCase.id === id);
}
