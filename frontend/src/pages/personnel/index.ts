/**
 * Personnel Page Module
 *
 * Barrel export for the Personnel page and related components.
 */

export { default } from './Personnel';
export { default as Personnel } from './Personnel';
export { default as PersonnelTable } from './components/PersonnelTable';
export { default as PersonnelFilters } from './components/PersonnelFilters';
export { default as PersonnelDrawer } from './components/PersonnelDrawer';
export { default as AddPersonnelModal } from './components/AddPersonnelModal';
export { usePersonnelData } from './hooks/usePersonnelData';
export * from './types/personnel.types';