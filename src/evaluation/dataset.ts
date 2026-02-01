/**
 * Golden Dataset for RAG Evaluation
 * 
 * This dataset contains test cases covering:
 * - LAU (Ley de Arrendamientos Urbanos) questions
 * - LPH (Ley de Propiedad Horizontal) questions
 * - Out-of-scope questions (should refuse)
 * - Ambiguous questions
 */

import type { EvaluationCase } from './types.js';

export const DATASET_VERSION = '1.0.0';

export const goldenDataset: EvaluationCase[] = [
  // ===== LAU Cases (Easy) =====
  {
    id: 'lau-001',
    question: '¿Cuánto preaviso necesito para no renovar un contrato de alquiler?',
    tags: ['LAU', 'preaviso', 'renovación'],
    expectedCitations: ['Artículo 10, LAU'],
    difficulty: 'easy',
    notes: 'Classic LAU question about notice period',
  },
  {
    id: 'lau-002',
    question: '¿Cuál es la duración mínima de un contrato de alquiler de vivienda?',
    tags: ['LAU', 'duración', 'plazos'],
    expectedCitations: ['Artículo 9, LAU'],
    difficulty: 'easy',
  },
  {
    id: 'lau-003',
    question: '¿Quién paga las reparaciones en un piso alquilado?',
    tags: ['LAU', 'reparaciones', 'obligaciones'],
    expectedCitations: ['Artículo 21, LAU', 'Artículo 22, LAU'],
    difficulty: 'easy',
  },
  {
    id: 'lau-004',
    question: '¿Puede el arrendador subir el alquiler durante el contrato?',
    tags: ['LAU', 'renta', 'actualización'],
    expectedCitations: ['Artículo 18, LAU'],
    difficulty: 'medium',
  },
  {
    id: 'lau-005',
    question: '¿Cuándo puede el arrendador resolver el contrato anticipadamente?',
    tags: ['LAU', 'resolución', 'desistimiento'],
    expectedCitations: ['Artículo 11, LAU'],
    difficulty: 'medium',
  },

  // ===== LPH Cases (Easy) =====
  {
    id: 'lph-001',
    question: '¿Puedo poner un negocio en mi piso de una comunidad de propietarios?',
    tags: ['LPH', 'actividades', 'prohibiciones'],
    expectedCitations: ['Artículo 7, LPH'],
    difficulty: 'easy',
  },
  {
    id: 'lph-002',
    question: '¿Qué gastos tengo que pagar en una comunidad de propietarios?',
    tags: ['LPH', 'gastos', 'cuotas'],
    expectedCitations: ['Artículo 9, LPH'],
    difficulty: 'easy',
  },
  {
    id: 'lph-003',
    question: '¿Cómo se calculan los coeficientes en una comunidad de propietarios?',
    tags: ['LPH', 'coeficientes', 'participación'],
    expectedCitations: ['Artículo 5, LPH'],
    difficulty: 'medium',
  },
  {
    id: 'lph-004',
    question: '¿Puede la comunidad prohibir el alquiler de pisos?',
    tags: ['LPH', 'alquiler', 'limitaciones'],
    expectedCitations: ['Artículo 7, LPH', 'Artículo 17, LPH'],
    difficulty: 'medium',
  },

  // ===== Multi-law Cases (Hard) =====
  {
    id: 'multi-001',
    question: 'Si alquilo un piso en una comunidad, ¿quién paga los gastos de comunidad?',
    tags: ['LAU', 'LPH', 'gastos', 'multi-law'],
    expectedCitations: ['Artículo 20, LAU', 'Artículo 9, LPH'],
    difficulty: 'hard',
    notes: 'Requires understanding both LAU and LPH',
  },

  // ===== Refusal Cases (Out-of-scope) =====
  {
    id: 'refuse-001',
    question: '¿Cuánto es el ITP en Barcelona?',
    tags: ['out-of-scope', 'taxes'],
    shouldRefuse: true,
    difficulty: 'easy',
    notes: 'Should refuse - tax questions not in knowledge base',
  },
  {
    id: 'refuse-002',
    question: '¿Qué es un contrato de compraventa?',
    tags: ['out-of-scope', 'civil-law'],
    shouldRefuse: true,
    difficulty: 'easy',
    notes: 'Should refuse - not rental or community law',
  },
  {
    id: 'refuse-003',
    question: '¿Cómo puedo hacer una hipoteca?',
    tags: ['out-of-scope', 'mortgage'],
    shouldRefuse: true,
    difficulty: 'easy',
    notes: 'Should refuse - mortgage questions not covered',
  },
  {
    id: 'refuse-004',
    question: '¿Qué dice el código penal sobre el robo?',
    tags: ['out-of-scope', 'criminal-law'],
    shouldRefuse: true,
    difficulty: 'easy',
    notes: 'Should refuse - criminal law not in scope',
  },

  // ===== Ambiguous Cases =====
  {
    id: 'ambiguous-001',
    question: '¿Puedo subarrendar mi piso?',
    tags: ['LAU', 'subarriendo', 'ambiguous'],
    expectedCitations: ['Artículo 8, LAU'],
    difficulty: 'medium',
    notes: 'Ambiguous - depends on contract terms',
  },
  {
    id: 'ambiguous-002',
    question: '¿Puedo tener mascotas en un piso alquilado?',
    tags: ['LAU', 'mascotas', 'ambiguous'],
    expectedCitations: ['Artículo 7, LAU'],
    difficulty: 'medium',
    notes: 'Ambiguous - depends on contract and community rules',
  },

  // ===== Edge Cases =====
  {
    id: 'edge-001',
    question: '¿Qué pasa si no pago el alquiler?',
    tags: ['LAU', 'impago', 'desahucio'],
    expectedCitations: ['Artículo 27, LAU'],
    difficulty: 'medium',
    notes: 'Important edge case about non-payment',
  },
  {
    id: 'edge-002',
    question: 'El arrendador no hace las reparaciones necesarias, ¿qué puedo hacer?',
    tags: ['LAU', 'reparaciones', 'incumplimiento'],
    expectedCitations: ['Artículo 21, LAU'],
    difficulty: 'medium',
    notes: 'Edge case about landlord obligations',
  },
];

/**
 * Get dataset by tags
 */
export function getDatasetByTags(tags: string[]): EvaluationCase[] {
  return goldenDataset.filter(testCase => 
    tags.some(tag => testCase.tags.includes(tag))
  );
}

/**
 * Get dataset by difficulty
 */
export function getDatasetByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): EvaluationCase[] {
  return goldenDataset.filter(testCase => testCase.difficulty === difficulty);
}
