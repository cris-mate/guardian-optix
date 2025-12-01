/**
 * Guards Page Module
 *
 * Barrel export for the Guards page and related components.
 */

export { default } from './Guards';
export { default as Guards } from './Guards';
export { default as GuardsTable } from './components/GuardsTable';
export { default as GuardsFilters } from './components/GuardsFilters';
export { default as GuardsDrawer } from './components/GuardsDrawer';
export { default as AddGuardsModal } from './components/AddGuardsModal';
export { useGuardsData } from './hooks/useGuardsData';
export * from './types/guards.types';