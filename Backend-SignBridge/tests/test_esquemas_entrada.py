"""Tests unitarios de lo que la API acepta como texto de entrada.

Autor: @juan-soto350 · Responsable del backend en S3

Son las reglas de los schemas de traducción y de mensajes: qué se limpia,
qué se rechaza y dónde están los límites.
"""
import pytest
from pydantic import ValidationError

from app.schemas.messages import MessageCreate
from app.schemas.traduccion import FrameRequest, TextoTraduccionRequest, VozTraduccionRequest

# ── Texto a traducir y texto dictado: misma regla de limpieza ────────────────

ESQUEMAS_DE_TEXTO = [
    pytest.param(TextoTraduccionRequest, "texto", id="texto"),
    pytest.param(VozTraduccionRequest, "texto_dictado", id="voz"),
]


@pytest.mark.parametrize("esquema, campo", ESQUEMAS_DE_TEXTO)
@pytest.mark.parametrize(
    "entrada, esperado",
    [
        ("hola", "hola"),
        ("  buenas noches  ", "buenas noches"),
        ("¿cómo estás?", "¿cómo estás?"),       # signos del español se conservan
        ("hola 😀", "hola"),                      # el emoji se quita
        ("gracias @#$", "gracias"),               # sin espacio al final tras limpiar
        ("@ hola", "hola"),                       # ni al principio
    ],
)
def test_text_is_cleaned_before_translating(esquema, campo, entrada, esperado):
    # Arrange / Act
    datos = esquema(**{campo: entrada})

    # Assert
    assert getattr(datos, campo) == esperado


@pytest.mark.parametrize("esquema, campo", ESQUEMAS_DE_TEXTO)
@pytest.mark.parametrize("entrada", ["   ", "@#$%", "😀😀"])
def test_text_with_only_special_characters_is_rejected(esquema, campo, entrada):
    with pytest.raises(ValidationError):
        esquema(**{campo: entrada})


@pytest.mark.parametrize("esquema, campo", ESQUEMAS_DE_TEXTO)
@pytest.mark.parametrize(
    "largo, valido",
    [(1, True), (1000, True), (1001, False)],   # valores límite de max_length
)
def test_text_length_limits(esquema, campo, largo, valido):
    texto = "a" * largo
    if valido:
        assert getattr(esquema(**{campo: texto}), campo) == texto
    else:
        with pytest.raises(ValidationError):
            esquema(**{campo: texto})


def test_dictated_text_defaults_to_colombian_spanish():
    assert VozTraduccionRequest(texto_dictado="hola").idioma == "es-CO"


# ── Frame de la cámara ────────────────────────────────────────────────────────

@pytest.mark.parametrize(
    "entrada, esperado",
    [
        ("data:image/jpeg;base64,QUJDREVGR0hJSktM", "QUJDREVGR0hJSktM"),   # viene del canvas con prefijo
        ("QUJDREVGR0hJSktM", "QUJDREVGR0hJSktM"),                          # ya viene limpio
        ("  QUJDREVGR0hJSktM\n", "QUJDREVGR0hJSktM"),
    ],
)
def test_frame_prefix_is_removed(entrada, esperado):
    assert FrameRequest(frame_base64=entrada).frame_base64 == esperado


# ── Mensajes entre usuarios ───────────────────────────────────────────────────

@pytest.mark.parametrize(
    "largo, valido",
    [(1, True), (2000, True), (2001, False)],   # valores límite
)
def test_message_length_limit(largo, valido):
    contenido = "x" * largo
    if valido:
        assert MessageCreate(id_receiver="u2", content=contenido).content == contenido
    else:
        with pytest.raises(ValidationError, match="2000"):
            MessageCreate(id_receiver="u2", content=contenido)


def test_message_is_trimmed_and_cannot_be_blank():
    assert MessageCreate(id_receiver="u2", content="  hola  ").content == "hola"
    with pytest.raises(ValidationError, match="vacío"):
        MessageCreate(id_receiver="u2", content="   ")
