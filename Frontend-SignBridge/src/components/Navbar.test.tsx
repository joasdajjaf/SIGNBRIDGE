// Barra de navegación: qué enlaces ve cada rol, enlace activo, navegar y salir.
// Autor: @juan-soto350 · Capa S3: Front (componente Navbar)
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi, notificationsApi } from '../api/client';
import { renderEnRuta } from '../test/render';
import { Navbar } from './Navbar';

function sesion(rol: string) {
  // AuthProvider pide el perfil al arrancar: se responde sin ir a la red
  vi.spyOn(authApi, 'me').mockResolvedValue({ data: { full_name: 'Ana Gómez', role: rol } } as never);
  localStorage.setItem('token', 'tok');
  localStorage.setItem('role', rol);
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(notificationsApi, 'unreadCount').mockResolvedValue({ data: { unread: 0 } } as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Navbar', () => {
  // Lo que cambia según el rol: el panel propio, "Soporte" y "Estadísticas".
  it.each([
    // rol,             debe ver,                                    no debe ver
    ['Cliente',       ['Mi Panel'],                                ['Panel Admin', 'Panel de Soporte', 'Estadísticas']],
    ['Soporte',       ['Panel de Soporte'],                        ['Mi Panel', 'Panel Admin', 'Estadísticas']],
    ['Administrador', ['Panel Admin', '🎧 Soporte', 'Estadísticas'], ['Mi Panel', 'Panel de Soporte']],
  ])('the %s role sees only its own links', async (rol, visibles, ocultos) => {
    sesion(rol);

    renderEnRuta(<Navbar />, '/home');

    const nav = await screen.findByRole('navigation', { name: 'Principal' });
    expect(await within(nav).findByText('Ana Gómez')).toBeInTheDocument();
    for (const nombre of visibles) {
      expect(within(nav).getByRole('button', { name: new RegExp(`${nombre}$`) })).toBeInTheDocument();
    }
    for (const nombre of ocultos) {
      // queryBy devuelve null en vez de lanzar error: sirve para afirmar que NO está
      expect(within(nav).queryByRole('button', { name: new RegExp(`${nombre}$`) })).not.toBeInTheDocument();
    }
    // Los enlaces comunes los ven todos
    for (const nombre of ['Inicio', 'Vocabulario', 'Voz a Señas', 'Señas a Texto']) {
      expect(within(nav).getByRole('button', { name: new RegExp(nombre) })).toBeInTheDocument();
    }
  });

  it('should mark the current page as active', async () => {
    sesion('Cliente');

    renderEnRuta(<Navbar />, '/vocabulary');

    expect(await screen.findByRole('button', { name: /vocabulario/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: /inicio/i })).not.toHaveAttribute('aria-current');
  });

  it('should go to the clicked page', async () => {
    sesion('Cliente');
    renderEnRuta(<Navbar />, '/home');

    await userEvent.click(await screen.findByRole('button', { name: /voz a señas/i }));

    expect(await screen.findByTestId('ubicacion')).toHaveTextContent('/voice-to-sign');
  });

  it('should close the session and go to the landing page', async () => {
    sesion('Administrador');
    renderEnRuta(<Navbar />, '/home');

    await userEvent.click(await screen.findByRole('button', { name: 'Salir' }));

    await waitFor(() => expect(screen.getByTestId('ubicacion')).toHaveTextContent(/^\/$/));
    expect(localStorage.getItem('token')).toBeNull();
  });
});
