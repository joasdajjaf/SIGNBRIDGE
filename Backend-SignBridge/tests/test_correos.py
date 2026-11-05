"""Tests unitarios de los correos que envía la app.

Autor: @juan-soto350 · Responsable del backend en S3

El envío SMTP se reemplaza con un doble: se prueba qué correo se arma
(destinatario, asunto, enlaces y que lo que escribe una persona no pueda
inyectar HTML), sin conectarse a Mailtrap.
"""
import asyncio
from unittest.mock import AsyncMock, patch

import pytest

from app.services import mail


@pytest.fixture
def enviado():
    """Reemplaza _send y devuelve el doble para inspeccionar la llamada."""
    with patch.object(mail, "_send", new=AsyncMock()) as doble:
        yield doble


def html_enviado(doble):
    destinatario, asunto, html = doble.await_args.args
    return destinatario, asunto, html


def test_welcome_email_goes_to_the_user_with_a_link_to_the_panel(enviado):
    asyncio.run(mail.send_welcome_email("ana@example.com", "Ana"))

    destinatario, asunto, html = html_enviado(enviado)
    assert destinatario == "ana@example.com"
    assert "Bienvenido/a" in asunto
    assert "Ana" in html
    assert f"{mail.settings.FRONTEND_URL}/dashboard" in html


def test_reset_email_carries_the_token_in_the_link(enviado):
    asyncio.run(mail.send_reset_email("ana@example.com", "tok-123"))

    _, asunto, html = html_enviado(enviado)
    assert "Restablecer contraseña" in asunto
    assert f"{mail.settings.FRONTEND_URL}/reset-password?token=tok-123" in html
    assert "1 hora" in html


def test_resolved_ticket_email_includes_the_solution_with_line_breaks(enviado):
    asyncio.run(mail.send_ticket_resolved_email("ana@example.com", "Ana", "Video", "Paso 1\nPaso 2"))

    _, asunto, html = html_enviado(enviado)
    assert "resuelto" in asunto
    assert "Paso 1<br>Paso 2" in html


@pytest.mark.parametrize(
    "enviar",
    [
        pytest.param(lambda n: mail.send_welcome_email("a@b.co", n), id="bienvenida"),
        pytest.param(lambda n: mail.send_ticket_resolved_email("a@b.co", n, "<i>x</i>", "<b>y</b>"), id="ticket"),
    ],
)
def test_text_written_by_people_cannot_inject_html(enviado, enviar):
    asyncio.run(enviar("<script>alert(1)</script>"))

    _, _, html = html_enviado(enviado)
    assert "<script>" not in html
    assert "&lt;script&gt;" in html


def test_smtp_errors_are_raised_to_the_caller():
    with patch.object(mail.aiosmtplib, "send", new=AsyncMock(side_effect=OSError("sin red"))):
        with pytest.raises(OSError):
            asyncio.run(mail._send("a@b.co", "Asunto", "<p>hola</p>"))


def test_smtp_send_uses_the_configured_server():
    with patch.object(mail.aiosmtplib, "send", new=AsyncMock()) as smtp:
        asyncio.run(mail._send("a@b.co", "Asunto", "<p>hola</p>"))

    mensaje = smtp.await_args.args[0]
    assert (mensaje["To"], mensaje["Subject"]) == ("a@b.co", "Asunto")
    assert smtp.await_args.kwargs["hostname"] == mail.settings.MAIL_SERVER
