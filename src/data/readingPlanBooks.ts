import { getBooksByCategory, type AcademyBook } from './academyBooks';

/** Plano sugerido (10 livros). TODO: substituir por recomendação baseada em património. */
export function getDefaultReadingPlanBooks(): AcademyBook[] {
  const f = getBooksByCategory('finance').slice(0, 4);
  const i = getBooksByCategory('investments').slice(0, 4);
  const e = getBooksByCategory('entrepreneurship').slice(0, 2);
  return [...f, ...i, ...e];
}
