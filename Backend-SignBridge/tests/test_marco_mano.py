"""Tests unitarios de la geometría de la mano (app/services/abecedario.py).

Autor: @juan-soto350 · Responsable del backend en S3

Se usa una mano sintética de 21 puntos con medidas redondas, sin cámara ni
MediaPipe: muñeca abajo, nudillos 0.5 más arriba (eso es "1 palma").
"""
from types import SimpleNamespace

import pytest

from app.services.abecedario import BASES, MEDIAS, MUNECA, PUNTAS, MarcoMano, _extendido, _juntos


def mano(**puntos):
    """21 landmarks; los que no se pasan quedan en la muñeca."""
    lm = [SimpleNamespace(x=0.5, y=1.0) for _ in range(21)]
    lm[MUNECA] = SimpleNamespace(x=0.5, y=1.0)
    lm[BASES["medio"]] = SimpleNamespace(x=0.5, y=0.5)     # 1 palma hacia arriba
    lm[BASES["indice"]] = SimpleNamespace(x=0.4, y=0.5)
    lm[BASES["menique"]] = SimpleNamespace(x=0.7, y=0.5)
    for indice, (x, y) in puntos.items():
        lm[int(indice[1:])] = SimpleNamespace(x=x, y=y)
    return lm


def p(n):
    """Nombre de argumento para el landmark n (p8 = punta del índice)."""
    return f"p{n}"


def test_wrist_is_the_origin_and_knuckles_are_one_palm_away():
    marco = MarcoMano(mano())

    assert marco.palma == pytest.approx(0.5)
    assert marco.proyectar(SimpleNamespace(x=0.5, y=1.0)) == pytest.approx((0, 0))
    assert marco.proyectar(SimpleNamespace(x=0.5, y=0.5)) == pytest.approx((1, 0))
    assert marco.proyectar(SimpleNamespace(x=0.5, y=0.0)) == pytest.approx((2, 0))


def test_width_is_negative_on_the_thumb_side():
    marco = MarcoMano(mano())

    _, lado_pulgar = marco.proyectar(SimpleNamespace(x=0.3, y=0.5))
    _, lado_menique = marco.proyectar(SimpleNamespace(x=0.7, y=0.5))

    assert lado_pulgar < 0 < lado_menique


def test_distances_are_measured_in_palms():
    assert MarcoMano(mano()).normalizar(0.25) == pytest.approx(0.5)


def test_hand_with_no_size_does_not_divide_by_zero():
    lm = [SimpleNamespace(x=0.5, y=0.5) for _ in range(21)]   # todos en el mismo punto

    marco = MarcoMano(lm)

    assert marco.palma > 0


# La punta debe pasar 0.10 palmas por encima de la articulación media.
# Media del índice en 1.4 palmas: valores alrededor del límite.
@pytest.mark.parametrize(
    "largo_punta, extendido",
    [(1.0, False), (1.45, False), (1.55, True), (2.0, True)],
)
def test_finger_is_extended_only_past_the_threshold(largo_punta, extendido):
    lm = mano(**{p(MEDIAS["indice"]): (0.4, 1.0 - 1.4 * 0.5), p(PUNTAS["indice"]): (0.4, 1.0 - largo_punta * 0.5)})

    assert _extendido(lm, MarcoMano(lm), "indice") is extendido


# El pulgar se mide de lado: separación de su punta al nudillo del índice
# mayor a 0.62 palmas. 0.60 queda justo debajo y 0.64 justo encima.
@pytest.mark.parametrize("separacion, extendido", [(0.60, False), (0.64, True)])
def test_thumb_is_extended_when_it_separates_from_the_index(separacion, extendido):
    lm = mano(**{p(PUNTAS["pulgar"]): (0.4 - separacion * 0.5, 0.5)})

    assert _extendido(lm, MarcoMano(lm), "pulgar") is extendido


@pytest.mark.parametrize("separacion, juntos", [(0.30, True), (0.50, False)])
def test_two_fingertips_are_together_below_040_palms(separacion, juntos):
    lm = mano(**{p(PUNTAS["indice"]): (0.4, 0.0), p(PUNTAS["medio"]): (0.4 + separacion * 0.5, 0.0)})

    assert _juntos(lm, MarcoMano(lm), "indice", "medio") is juntos
