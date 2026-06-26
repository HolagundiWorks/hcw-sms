import { useSchool } from './useSchool';
import { termsFor } from '../lib/institution';

// Current institution's nomenclature (Teacher vs Lecturer, etc.).
export function useTerms() {
  const { data } = useSchool();
  return termsFor(data?.type);
}
