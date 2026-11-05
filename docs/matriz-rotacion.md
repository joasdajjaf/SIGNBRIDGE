# Matriz de rotación de capas

**Grupo**: SignBridge · **Ficha**: 3228973 B · **Stack**: React + FastAPI + PostgreSQL

Capas: **Front** (React) · **API** (backend) · **BD** (integración) · **E2E** (Playwright)

Reglas:

- Cada semana cambias de capa. No repites capa hasta haber pasado por las cuatro.
- En la columna escribe la capa y, al cerrar la semana, el enlace a tu PR de tests.
- Quien revisa tu PR debe haber trabajado en otra capa esa semana.

| Integrante (usuario GitHub) | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 |
|---|---|---|---|---|---|---|---|---|---|
| @javierperez14 | E2E | API | Front: TranslationHistory ([#2](../../pull/2)) | | | | | | |
| @juan-soto350 | E2E | Front | Front: Navbar ([#5](../../pull/5)) + backend al 40 % ([#6](../../pull/6)) | | | | | | |
| @Sebas-p-s | E2E | BD | Front: Notifications ([#3](../../pull/3)) | | | | | | |
| @Lincoln1986 | E2E | E2E (CI) | Front: GoalProgressCard ([#4](../../pull/4)) | | | | | | |

> S2: Front, API y BD son distintas a la capa de S1. En un grupo de 4 alguien repite E2E: esta semana esa capa **monta el CI** (receta de CI) y además escribe sus 3 tests unitarios en cualquier capa. Por eso @Lincoln1986 la toma, y en S3 rota a una capa que no haya tenido.

> S3: semana de **tema común**, todos en Front, cada uno con un componente distinto. El backend también debe llegar al 40 %: lo lleva quien tuvo Front en S2 (@juan-soto350), con tests unitarios como en la semana 2.

## Cobertura semanal

Anota la cobertura real al cerrar cada semana. El umbral de la semana siguiente es el mayor entre el piso del plan y este valor, redondeado hacia abajo.

> El piso del plan se mide en **líneas**. Las demás métricas de Vitest (sentencias, funciones, ramas) quedan fijadas en su valor real como trinquete: tampoco pueden bajar.

| Semana | Frontend (%) | Backend (%) | Umbral configurado para la semana siguiente |
|---|---|---|---|
| S1 (línea base) | 0 | 0 | 30 (piso de la semana 2) |
| S2 | 34,04 | 31,60 | Front: líneas 34 (sentencias 32, funciones 27, ramas 27) · Back: 31 |
| S3 | 40,93 | 40,32 | Front: líneas 40 (sentencias 39, funciones 35, ramas 34) · Back: 40 |

## Regla de rama

| Repo | Regla |
|---|---|
| javierperez14/SIGNBRIDGE | Ruleset **"CI obligatorio en main y develop"**: PR obligatorio + checks `frontend`, `backend` y `auditoría` en verde (Settings → Rules → Rulesets). Mientras no esté activo: regla manual, nadie fusiona con el CI en rojo |

## Registro de vocero aleatorio

| Semana | Vocero | Capa preguntada | Respuesta escrita | Resultado (Alto / Medio / Bajo) |
|---|---|---|---|---|
| S1 | | | | |
