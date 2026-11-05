// Página de notificaciones: lista, filtro "sin leer", marcar, eliminar y error.
// Autor: @Sebas-p-s · Capa S3: Front (componente Notifications)
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { notificationsApi } from '../api/client';
import type { NotificationItem } from '../api/client';
import Notifications from './Notifications';

const AVISOS = [
  { id_notification: 'n1', type: 'ticket_resolved', title: 'Tu ticket fue resuelto', body: 'Ya funciona el video', read_at: null, created_at: '2026-10-20T15:00:00Z' },
  { id_notification: 'n2', type: 'feedback_answered', title: 'Soporte respondió tu valoración', read_at: '2026-10-01T10:00:00Z', created_at: '2026-10-01T10:00:00Z' },
] as NotificationItem[];

function cargar(datos = AVISOS) {
  return vi.spyOn(notificationsApi, 'list').mockResolvedValue({ data: datos } as never);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Notifications', () => {
  it('should list every notification and count the unread ones', async () => {
    const lista = cargar();

    render(<Notifications />);

    expect(await screen.findByText('Tu ticket fue resuelto')).toBeInTheDocument();
    expect(screen.getByText('Soporte respondió tu valoración')).toBeInTheDocument();
    expect(screen.getByText('1 sin leer')).toBeInTheDocument();
    expect(lista).toHaveBeenCalledWith(false, 100);
  });

  it('should show only the unread ones with the "Sin leer" filter', async () => {
    cargar();
    render(<Notifications />);
    await screen.findByText('Tu ticket fue resuelto');

    await userEvent.click(screen.getByRole('button', { name: 'Sin leer' }));

    expect(screen.getByRole('button', { name: 'Sin leer' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Tu ticket fue resuelto')).toBeInTheDocument();
    expect(screen.queryByText('Soporte respondió tu valoración')).not.toBeInTheDocument();
  });

  it('should mark one as read and hide the counter when none are left', async () => {
    cargar();
    const marcar = vi.spyOn(notificationsApi, 'markRead').mockResolvedValue({ data: {} } as never);
    render(<Notifications />);

    await userEvent.click(await screen.findByRole('button', { name: 'Marcar como leída: Tu ticket fue resuelto' }));

    expect(marcar).toHaveBeenCalledWith('n1');
    // queryBy: verificamos que algo NO está (getBy lanzaría un error)
    await waitFor(() => expect(screen.queryByText('1 sin leer')).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Marcar todas como leídas' })).not.toBeInTheDocument();
  });

  it('should mark all as read with one click', async () => {
    cargar();
    const todas = vi.spyOn(notificationsApi, 'markAllRead').mockResolvedValue({ data: { updated: 1, unread: 0 } } as never);
    render(<Notifications />);

    await userEvent.click(await screen.findByRole('button', { name: 'Marcar todas como leídas' }));

    expect(todas).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByText('1 sin leer')).not.toBeInTheDocument());
  });

  it('should delete a notification from the list', async () => {
    cargar();
    const borrar = vi.spyOn(notificationsApi, 'remove').mockResolvedValue({ data: {} } as never);
    render(<Notifications />);

    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar: Soporte respondió tu valoración' }));

    expect(borrar).toHaveBeenCalledWith('n2');
    await waitFor(() => expect(screen.queryByText('Soporte respondió tu valoración')).not.toBeInTheDocument());
  });

  it.each([
    // filtro,    avisos que llegan,           mensaje esperado
    ['Todas',    [],                          'Todavía no tenés notificaciones.'],
    ['Sin leer', [AVISOS[1]] /* ya leída */,  'No tenés notificaciones sin leer.'],
  ])('should show the empty message for the "%s" filter', async (boton, datos, mensaje) => {
    cargar(datos as NotificationItem[]);
    render(<Notifications />);

    await userEvent.click(await screen.findByRole('button', { name: boton }));

    expect(await screen.findByText(mensaje)).toBeInTheDocument();
  });

  it('should show an error alert when the list cannot be loaded', async () => {
    vi.spyOn(notificationsApi, 'list').mockRejectedValue(new Error('500'));

    render(<Notifications />);

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar las notificaciones.');
  });
});
