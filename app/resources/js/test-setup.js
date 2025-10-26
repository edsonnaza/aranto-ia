import '@testing-library/jest-dom';

// Mock de fetch para las pruebas
global.fetch = vi.fn();

// Mock básico de Inertia
global.route = vi.fn((name, params) => {
  return `/${name}${params ? '?' + new URLSearchParams(params).toString() : ''}`;
});

// Mock de meta CSRF token
const mockMeta = document.createElement('meta');
mockMeta.setAttribute('name', 'csrf-token');
mockMeta.setAttribute('content', 'mock-csrf-token');
document.head.appendChild(mockMeta);

// Configuración global para tests
beforeEach(() => {
  fetch.mockClear();
});