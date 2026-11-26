# Sesión y RBAC

Sigue [Arquitectura](../ARCHITECTURE.md), [Consumo HTTP](../API_CONTRACT.md) y las guías Next instaladas. Valida identidad y sesión registrada a través de AutoCheck. Autoriza el rol funcional con el perfil actual para Ciudadano, Inspector y Administrador. Cada página, acceso a datos y acción debe validar en servidor según su alcance. Usa el contexto React para reflejar estado de presentación y verifica las políticas de recurso, permiso y centro con la API.
