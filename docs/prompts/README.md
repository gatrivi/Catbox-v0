# Prompts maestros

Planes de ejecución generados por la IA **antes** de tocar el código. Objetivo: margen de error cercano a cero.

## Flujo obligatorio

```
Usuario solicita cambio
        ↓
IA investiga (codebase + chat + web si aplica)
        ↓
¿Es aplicable? → No: explicar por qué y parar
        ↓ Sí
Redactar prompt maestro (nivel senior)
        ↓
Guardar aquí: {slug}_{YYYY-MM-DD}.md
        ↓
Presentar resumen al usuario + ruta del archivo
        ↓
ESPERAR palabra clave: Procede
        ↓
Ejecutar el plan guardado
        ↓
Changelog en ../changelogs/ si el cambio fue grande
```

## Puerta **Procede**

| Situación | ¿Ejecutar código? |
|-----------|---------------------|
| Usuario no dijo **Procede** | **No** — solo investigar, auditar, responder preguntas |
| Usuario dijo **Procede** | **Sí** — seguir el prompt maestro guardado |
| "Hazlo ya" / "adelante" sin **Procede** | Pedir confirmación con la palabra clave exacta |

## Convención de nombre

```
{feature-o-tarea}_{YYYY-MM-DD}.md
```

## Plantilla

Copiar la estructura de [PROMPT-TEMPLATE.md](PROMPT-TEMPLATE.md) al crear cada prompt maestro.

## Estados del archivo

| Estado | Significado |
|--------|-------------|
| `borrador` | Investigación incompleta |
| `listo para Procede` | Plan validado; esperando palabra clave |
| `ejecutado` | Cambios aplicados; actualizar al terminar |

Ver [`.cursorrules`](../../.cursorrules).
