/**
 * Modo de acesso à Academia.
 * - `free`: lançamento — todos os utilizadores autenticados têm acesso (sem consultar `profiles`).
 * - `paid`: exige `academy_unlocked_at` ou `academy_grandfathered` em `public.profiles`.
 *
 * Definir em `.env`: EXPO_PUBLIC_ACADEMY_ACCESS_MODE=free | paid
 */
export type AcademyAccessMode = 'free' | 'paid';

export function getAcademyAccessMode(): AcademyAccessMode {
  const raw = (process.env.EXPO_PUBLIC_ACADEMY_ACCESS_MODE || 'free').toLowerCase().trim();
  return raw === 'paid' ? 'paid' : 'free';
}

export function isAcademyFreeLaunch(): boolean {
  return getAcademyAccessMode() === 'free';
}
