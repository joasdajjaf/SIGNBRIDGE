"""Tests unitarios del servicio de notificaciones in-app.

Autor: @juan-soto350 · Responsable del backend en S3

La sesión de base de datos es un doble (MagicMock): el test verifica las
reglas del servicio, no SQLAlchemy ni PostgreSQL.
"""
from unittest.mock import MagicMock

from app.services import notificaciones as srv


def sesion_falsa(ya_existe=None):
    """Una sesión de SQLAlchemy de mentira; .first() devuelve `ya_existe`."""
    db = MagicMock()
    db.query.return_value.filter.return_value.first.return_value = ya_existe
    return db


def test_creates_the_notification_and_saves_it():
    db = sesion_falsa()

    aviso = srv.crear_notificacion(db, "u1", srv.TIPO_TICKET_RESUELTO, "Título", "Cuerpo", "t1")

    assert (aviso.id_user, aviso.type, aviso.title, aviso.body, aviso.reference_id) == (
        "u1", "ticket_resolved", "Título", "Cuerpo", "t1",
    )
    db.add.assert_called_once_with(aviso)
    db.commit.assert_called_once()


def test_does_not_duplicate_a_notification_for_the_same_reference():
    existente = object()
    db = sesion_falsa(ya_existe=existente)

    aviso = srv.crear_notificacion(db, "u1", srv.TIPO_TICKET_RESUELTO, "Título", reference_id="t1")

    assert aviso is existente
    db.add.assert_not_called()


def test_without_reference_it_does_not_look_for_duplicates():
    db = sesion_falsa()

    srv.crear_notificacion(db, "u1", "aviso", "Título")

    db.query.assert_not_called()
    db.add.assert_called_once()


def test_a_database_error_never_breaks_the_caller():
    db = sesion_falsa()
    db.commit.side_effect = RuntimeError("se cayó la base")

    aviso = srv.crear_notificacion(db, "u1", "aviso", "Título")

    assert aviso is None
    db.rollback.assert_called_once()


def test_resolved_ticket_notification_uses_the_subject_and_solution():
    db = sesion_falsa()

    aviso = srv.notificar_ticket_resuelto(db, "u1", "t9", "No carga el video", "Ya quedó")

    assert aviso.title == "Tu ticket «No carga el video» fue resuelto"
    assert (aviso.body, aviso.reference_id, aviso.type) == ("Ya quedó", "t9", "ticket_resolved")


def test_feedback_answer_without_text_has_no_body():
    db = sesion_falsa()

    aviso = srv.notificar_respuesta_valoracion(db, "u1", "f3", "")

    assert aviso.title == "Soporte respondió tu valoración"
    assert aviso.body is None   # "" se guarda como None, no como texto vacío
    assert aviso.type == "feedback_answered"
