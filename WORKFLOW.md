# Flujo de Trabajo (Git Workflow)

Para mantener el proyecto organizado y evitar errores en la rama `main`, adoptaremos el siguiente flujo basado en ramas y Pull Requests.

## 1. Crear una rama para cada tarea
Antes de empezar a programar, create una rama descriptiva desde `main`:

```bash
# Para nuevas funcionalidades:
git checkout -b feature/nombre-de-la-mejora

# Para corrección de errores:
git checkout -b fix/descripcion-del-bug

# Para tareas de mantenimiento o refactorización:
git checkout -b refactor/que-se-esta-limpiando
git checkout -b chore/dependencias-o-configs
```

## 2. Trabajar y hacer commits
Hacé tus cambios normalmente. Intentá que los commits sean pequeños y descriptivos.

```bash
git add .
git commit -m "feat: agregar sistema de notificaciones"
```

## 3. Subir la rama y abrir PR
Subí tu rama a GitHub:

```bash
git push origin feature/nombre-de-la-mejora
```

Luego, en GitHub:
1. Andá a la pestaña **Pull Requests**.
2. Click en **New Pull Request**.
3. Seleccioná tu rama y comparala con `main`.
4. El CI (GitHub Actions) correrá automáticamente para verificar que el código compile y pase el linter.

## 4. Revisión y Merge
Una vez que el PR sea aprobado y los tests pasen, podés mergearlo a `main`.

---
**💡 Tip:** Protegé la rama `main` en GitHub (Settings → Branches) para obligar a que todo cambio pase por un PR.
