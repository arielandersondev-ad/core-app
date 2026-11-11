# API de pacientes

Todas las operaciones requieren un token Bearer emitido por Core para la audiencia
`dentistry-api`. `DentistryJwtGuard` verifica firma, emisor, audiencia, vigencia y
claims. `DentistryPermissionGuard` comprueba el permiso exacto de la operación.

| Operación | Permiso del token |
| --- | --- |
| `GET /patients` | `dentistry:patients:read` |
| `GET /patients/:id` | `dentistry:patients:read` |
| `POST /patients` | `dentistry:patients:create` |
| `PATCH /patients/:id` | `dentistry:patients:update` |
| `DELETE /patients/:id` | `dentistry:patients:delete` |

Estos códigos deben existir y estar asignados a los roles en Core para que se
incluyan en los tokens. Esta conexión no crea permisos ni modifica roles.

La organización se obtiene de `principal.organizationId`. La autoría usa
`principal.membershipId`: `createdByMembershipId` en altas y
`updatedByMembershipId` en ediciones y eliminación lógica. `sub` identifica al usuario global y no
se utiliza como membresía.

Los DTO HTTP no aceptan esos campos de contexto. La configuración actual de
`ValidationPipe` elimina los campos desconocidos del body y de los DTO de query;
si un cliente antiguo los envía, no sustituyen los valores del token.

El listado acepta `search`, `status`, `page`, `pageSize` y `createdFrom` /
`createdTo` (fechas civiles `YYYY-MM-DD`, inclusivas, interpretadas en la zona
horaria de la organización), y devuelve `{ items, pagination }`. Alta y edición
aceptan además `maritalStatus`, `occupation` y `origin` (texto opcional). Los identificadores de ruta deben ser UUID válidos.
Los datos y el conteo se restringen a la organización autenticada. La lectura
o edición de un id ajeno devuelve 404.

DELETE no elimina físicamente el registro: guarda la fecha y hora actuales en
`deletedAt` y la membresía que hizo el cambio en `updatedByMembershipId`. Los
pacientes eliminados dejan de aparecer en el listado y no pueden consultarse,
editarse ni eliminarse de nuevo; sus datos relacionados se conservan.

Un token ausente o inválido devuelve 401; un token válido sin el permiso
requerido devuelve 403. Los cambios de permisos se reflejan al emitir un nuevo
token; se conserva la política actual de vigencia de Dentistry.

La asignación clínica por odontólogo sigue siendo una regla adicional pendiente.
