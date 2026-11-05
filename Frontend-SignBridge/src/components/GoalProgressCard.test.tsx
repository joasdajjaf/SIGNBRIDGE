// Tarjeta de meta: barra de progreso, valores límite y cartel de felicitación.
// Autor: @Lincoln1986 · Capa S3: Front (componente GoalProgressCard)
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { statsApi } from '../api/client';
import type { GoalProgress } from '../api/client';
import { GoalProgressCard } from './GoalProgressCard';

function progreso(cambios: Partial<GoalProgress> = {}): GoalProgress {
  return { meta: 10, total_traducciones: 3, en_ciclo_actual: 3, metas_completadas: 0, historial: [], ...cambios };
}

function cargar(datos: GoalProgress) {
  vi.spyOn(statsApi, 'miProgreso').mockResolvedValue({ data: datos } as never);
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GoalProgressCard', () => {
  it('should show the bar with the current progress', async () => {
    cargar(progreso({ en_ciclo_actual: 3 }));

    render(<GoalProgressCard />);

    const barra = await screen.findByRole('progressbar', { name: 'Progreso hacia la próxima meta' });
    expect(barra).toHaveAttribute('aria-valuenow', '3');
    expect(barra).toHaveAttribute('aria-valuemax', '10');
    expect(screen.getByText('3 / 10')).toBeInTheDocument();
  });

  // Valores límite del mensaje: inicio del ciclo (0), justo antes de la meta (9)
  // y el caso intermedio. El 9 es el que tenía el error de redacción.
  it.each([
    [0, 'Traducí 10 veces para completar tu próxima meta'],
    [1, 'Te faltan 9 traducciones para la próxima meta'],
    [9, 'Te falta 1 traducción para la próxima meta'],
  ])('with %i of 10 it says "%s"', async (enCiclo, mensaje) => {
    cargar(progreso({ en_ciclo_actual: enCiclo }));

    render(<GoalProgressCard />);

    expect(await screen.findByText(mensaje)).toBeInTheDocument();
  });

  it('should congratulate a new goal once and remember it after closing', async () => {
    cargar(progreso({
      en_ciclo_actual: 0, metas_completadas: 2,
      historial: [{ numero: 1, fecha: null }, { numero: 2, fecha: null }],
    }));
    const { unmount } = render(<GoalProgressCard />);

    const cartel = await screen.findByRole('dialog', { name: '¡Genial, completaste tu meta!' });
    expect(cartel).toHaveTextContent('2 metas');
    await userEvent.click(screen.getByRole('button', { name: /vamos/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(localStorage.getItem('signbridge:metas-festejadas')).toBe('2');

    // Al volver a entrar con las mismas 2 metas, ya no se festeja otra vez
    unmount();
    render(<GoalProgressCard />);
    expect(await screen.findByText('🔥 2 metas cumplidas')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should close the congratulation with the Escape key', async () => {
    cargar(progreso({ metas_completadas: 1, historial: [{ numero: 1, fecha: null }] }));
    render(<GoalProgressCard />);
    await screen.findByRole('dialog');

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('should render nothing when the progress cannot be loaded', async () => {
    const llamada = vi.spyOn(statsApi, 'miProgreso').mockRejectedValue(new Error('500'));

    const { container } = render(<GoalProgressCard />);

    await waitFor(() => expect(llamada).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
