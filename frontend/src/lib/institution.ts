// Institution types + the nomenclature each one uses. The app is institution-
// generic; the configured type drives how people/places are named in the UI.

export type InstitutionType = 'school' | 'preschool' | 'college' | 'puc';

export interface InstitutionTypeOption {
  value: InstitutionType;
  label: string;
}

export const INSTITUTION_TYPES: InstitutionTypeOption[] = [
  { value: 'school', label: 'School' },
  { value: 'preschool', label: 'Pre-School' },
  { value: 'college', label: 'College' },
  { value: 'puc', label: 'Pre-University College' },
];

export interface Terms {
  institution: string;
  educator: string; // singular, e.g. Teacher / Lecturer
  educatorPlural: string; // e.g. Teachers / Faculty
  student: string;
  students: string;
}

const TERMS: Record<InstitutionType, Terms> = {
  school: {
    institution: 'School',
    educator: 'Teacher',
    educatorPlural: 'Teachers',
    student: 'Student',
    students: 'Students',
  },
  preschool: {
    institution: 'Pre-School',
    educator: 'Teacher',
    educatorPlural: 'Teachers',
    student: 'Child',
    students: 'Children',
  },
  college: {
    institution: 'College',
    educator: 'Lecturer',
    educatorPlural: 'Faculty',
    student: 'Student',
    students: 'Students',
  },
  puc: {
    institution: 'Pre-University College',
    educator: 'Lecturer',
    educatorPlural: 'Lecturers',
    student: 'Student',
    students: 'Students',
  },
};

export function termsFor(type: string | null | undefined): Terms {
  return TERMS[type as InstitutionType] ?? TERMS.school;
}

export function institutionTypeLabel(type: string | null | undefined): string {
  return INSTITUTION_TYPES.find((t) => t.value === type)?.label ?? 'School';
}
