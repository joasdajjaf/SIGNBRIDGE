// Historial de traducciones: lista por día, vacío, error, búsqueda y borrar.
// Autor: @javierperez14 · Capa S3: Front (componente TranslationHistory)
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { statsApi } from '../api/client';
import type { HistoryDay } from '../api/client';
import { TranslationHistory } from './TranslationHistory';

// Fechas fijas y lejanas: así el título del día nunca es "Hoy" ni "Ayer"
// y el test no depende de cuándo se corra (FIRST: repetible).
const DIAS: HistoryDay[] = [
  {
    day: '2026-01-05', total: 1,
    sessions: [{ id_session: 's1', translation_type: 'voz', signs: [{ word: 'gracias' }] }],
  },
  {
    day: '2026-01-07', total: 2,
    sessions: [
      { id_session: 's2', translation_type: 'texto', signs: [{ word: 'hola' }, { word: 'amigo' }] },
      { id_session: 's3', translation_type: 'sign_to_text', signs: [], generated_text: 'VIDA' },
    ],
  },
];

function cargar(datos: HistoryDay[]) {
  return vi.spyOn(statsApi, 'miHistorial').mockResolvedValue({ data: datos } as never);
}

beforeEach(() => {
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TranslationHistory', () => {
  it('should show the summary and the days from newest to oldest', async () => {
    cargar(DIAS);

    render(<TranslationHistory />);

    expect(await screen.findByText('3 traducciones')).toBeInTheDocument();
    expect(screen.getByText('en 2 días')).toBeInTheDocument();
    const dias = screen.getAllByRole('heading', { level: 3 });
    // El 7 de enero va antes que el 5: el más reciente arriba
    expect(dias[0]).toHaveTextContent(/7 de enero/i);
    expect(dias[1]).toHaveTextContent(/5 de enero/i);
    expect(screen.getByText('"VIDA"')).toBeInTheDocument();
  });

  it('should show the empty state and disable the PDF button when there is nothing yet', async () => {
    cargar([]);

    render(<TranslationHistory />);

    expect(await screen.findByRole('heading', { name: 'Aún no tienes traducciones' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exportar pdf/i })).toBeDisabled();
  });

  it('should show an error alert when the history cannot be loaded', async () => {
    vi.spyOn(statsApi, 'miHistorial').mockRejectedValue(new Error('500'));

    render(<TranslationHistory />);

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar el historial de traducciones');
  });

  it('should search by word after the user types', async () => {
    const historial = cargar(DIAS);
    render(<TranslationHistory />);
    await screen.findByText('3 traducciones');
    historial.mockResolvedValue({ data: [DIAS[0]] } as never);

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar en el historial' }), 'gracias');

    // La búsqueda espera 400 ms sin teclear: findBy espera a que llegue
    expect(await screen.findByText('1 resultado para "gracias"')).toBeInTheDocument();
    expect(historial).toHaveBeenLastCalledWith(30, 'gracias');
  });

  it('should remove a translation when the user confirms', async () => {
    cargar(DIAS);
    const eliminar = vi.spyOn(statsApi, 'eliminarDeHistorial').mockResolvedValue({ data: {} } as never);
    render(<TranslationHistory />);

    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar "VIDA" del historial' }));

    expect(eliminar).toHaveBeenCalledWith('s3');
    await waitFor(() => expect(screen.queryByText('"VIDA"')).not.toBeInTheDocument());
    // El día del 7 ahora tiene una sola traducción
    const dia7 = screen.getByRole('heading', { name: /7 de enero/i }).parentElement!;
    expect(within(dia7).getByText('1 traducción')).toBeInTheDocument();
  });

  it('should not remove anything when the user cancels', async () => {
    cargar(DIAS);
    vi.mocked(window.confirm).mockReturnValue(false);
    const eliminar = vi.spyOn(statsApi, 'eliminarDeHistorial');
    render(<TranslationHistory />);

    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar "VIDA" del historial' }));

    expect(eliminar).not.toHaveBeenCalled();
    expect(screen.getByText('"VIDA"')).toBeInTheDocument();
  });
});
