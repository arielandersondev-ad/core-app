# Guía de Arquitectura y Desarrollo

## 1. Propósito

Este documento define la estructura, organización y convenciones de desarrollo del proyecto `platform`.

El objetivo es establecer una base que permita:

* Mantener una arquitectura clara y consistente.
* Separar responsabilidades.
* Facilitar el trabajo paralelo del equipo.
* Reducir el acoplamiento entre módulos.
* Permitir la evolución futura de la plataforma.
* Facilitar la incorporación de nuevas verticales de negocio.
* Mantener los límites entre dominio, aplicación, infraestructura y presentación.

## Arquitectura del proyecto

| Capa | Arquitectura |
| --- | --- |
| **Backend** | **DDD (Domain-Driven Design)** |
| **Frontend** | **Feature-Based Architecture** |

### Backend: DDD

El backend se organiza bajo **Domain-Driven Design**, complementado con:

* **Arquitectura Hexagonal / Ports & Adapters** para separar la lógica de negocio de detalles técnicos.
* **Modular Monolith** como estrategia inicial.
* **NestJS** como framework.

Cada módulo de negocio se estructura en capas: `domain`, `application`, `infrastructure` y `presentation`.

### Frontend: Feature-Based

El frontend se organiza bajo una **arquitectura basada en features (Feature-Based Architecture)**, donde cada funcionalidad de negocio vive en su propio módulo autónomo, utilizando **Next.js** como framework.

---

# 2. Estructura general del repositorio

```text
platform/
│
├── front/
│   └── src/
│       ├── app/                  # Next.js routing
│       ├── modules/              # Business features
│       │   ├── identity/
│       │   ├── organization/
│       │   ├── authorization/
│       │   ├── audit/
│       │   └── administration/
│       ├── shared/
│       └── infrastructure/
│
├── back/
│   ├── prisma/
│   └── src/
│       ├── common/
│       ├── modules/
│       │   ├── identity/
│       │   │   ├── application/
│       │   │   ├── domain/
│       │   │   ├── infrastructure/
│       │   │   └── presentation/
│       │   │
│       │   ├── organization/
│       │   ├── authorization/
│       │   └── audit/
│       │
│       ├── app.module.ts
│       └── main.ts
│
├── docs/
└── infrastructure/
```

---

# 3. Principios generales

## 3.1. Separación por dominio

El código debe organizarse principalmente por **módulo de negocio**, no por tipo técnico.

### Incorrecto

```text
src/
├── controllers/
├── services/
├── repositories/
└── entities/
```

Esta estructura agrupa archivos por tecnología y dificulta identificar qué código pertenece a cada dominio.

### Correcto

```text
src/
└── modules/
    ├── identity/
    ├── organization/
    ├── authorization/
    └── audit/
```

Cada módulo contiene sus propias responsabilidades.

---

# 4. Backend

La arquitectura del backend es **DDD (Domain-Driven Design)**.

El backend se complementa con:

* Arquitectura Hexagonal
* Modular Monolith
* NestJS

Cada módulo de negocio debe seguir, cuando aplique, la siguiente estructura:

```text
module/
├── application/
├── domain/
├── infrastructure/
└── presentation/
```

---

# 5. Domain

`domain/` contiene las reglas de negocio y conceptos fundamentales del dominio.

Debe ser la capa más independiente del sistema.

Ejemplo:

```text
domain/
├── entities/
├── value-objects/
├── repositories/
├── services/
├── events/
└── errors/
```

## Puede contener

* Entities
* Value Objects
* Domain Services
* Domain Events
* Repository interfaces
* Domain errors
* Reglas de negocio
* Invariantes

## No debe contener

* NestJS
* Prisma
* HTTP
* JWT
* Controllers
* DTOs HTTP
* Database-specific code
* Framework-specific decorators

### Regla

> El dominio no debe depender de infraestructura.

Por ejemplo:

```text
Domain
   ❌ → Prisma
   ❌ → NestJS
   ❌ → HTTP
   ❌ → JWT
```

---

# 6. Entities

Las entidades representan objetos del dominio que tienen identidad propia.

Ejemplo:

```text
identity/domain/entities/user.entity.ts
```

```text
organization/domain/entities/organization.entity.ts
organization/domain/entities/branch.entity.ts
organization/domain/entities/membership.entity.ts
```

Las entidades deben contener comportamiento relacionado con sus propias reglas cuando corresponda.

Evitar crear entidades que sean solamente estructuras de datos sin comportamiento si existe lógica de negocio que debería pertenecerles.

---

# 7. Value Objects

Los Value Objects representan conceptos del dominio cuyo valor importa más que su identidad.

Ejemplos:

```text
Email
UserId
OrganizationId
BranchId
PermissionCode
RoleName
```

Ejemplo:

```text
identity/domain/value-objects/email.vo.ts
```

Los Value Objects deben validar sus propias invariantes cuando sea responsabilidad del dominio.

---

# 8. Repository interfaces

Las interfaces de repositorio pertenecen al dominio.

Ejemplo:

```text
identity/domain/repositories/user.repository.ts
```

El dominio define qué necesita:

```text
UserRepository
```

pero no conoce cómo se almacena.

La implementación pertenece a infraestructura:

```text
identity/infrastructure/persistence/prisma/user.prisma-repository.ts
```

La dependencia debe ser:

```text
Application
     ↓
Domain Repository Interface
     ↑
Infrastructure Implementation
```

Nunca:

```text
Domain
   ↓
Prisma Repository
```

---

# 9. Application

`application/` contiene los casos de uso de la aplicación.

Ejemplo:

```text
application/
├── use-cases/
├── dto/
└── ports/
```

Los casos de uso representan acciones que el sistema puede realizar.

Ejemplos:

```text
CreateUser
UpdateUser
Login
RefreshSession
CreateOrganization
CreateBranch
CreateMembership
AssignRole
RecordAuditEvent
```

Un caso de uso debe coordinar el dominio y las dependencias necesarias para ejecutar una operación.

### Ejemplo conceptual

```text
CreateUserUseCase
        │
        ├── valida entrada
        ├── crea User
        ├── utiliza UserRepository
        └── genera eventos
```

El caso de uso no debe contener detalles de HTTP o Prisma.

---

# 10. Infrastructure

`infrastructure/` contiene implementaciones concretas de tecnologías externas.

Ejemplos:

```text
infrastructure/
├── persistence/
│   └── prisma/
├── security/
│   ├── jwt/
│   ├── password/
│   └── refresh-token/
├── messaging/
└── ...
```

Aquí pueden existir:

* Prisma
* JWT
* Password hashing
* Redis
* Email providers
* External APIs
* Message brokers
* File storage
* Implementaciones concretas de repositories

Infrastructure implementa interfaces definidas por capas internas cuando corresponda.

---

# 11. Presentation

`presentation/` es la entrada al sistema.

En NestJS normalmente contiene:

```text
presentation/
└── http/
    ├── controllers/
    ├── dto/
    ├── guards/
    ├── pipes/
    └── ...
```

Su responsabilidad es:

* Recibir requests.
* Validar entrada HTTP.
* Transformar datos HTTP.
* Invocar casos de uso.
* Transformar respuestas.
* Manejar detalles propios de HTTP.

Los controllers deben ser delgados.

### Evitar

```text
Controller
   ├── lógica de negocio
   ├── acceso a Prisma
   ├── validaciones complejas
   └── reglas de dominio
```

### Preferir

```text
Controller
     ↓
Use Case
     ↓
Domain
     ↓
Repository
```

---

# 12. DTOs

Los DTOs HTTP pertenecen a `presentation`.

Ejemplo:

```text
presentation/http/dto/create-user.dto.ts
```

Los DTOs de aplicación pertenecen a `application/dto` cuando sean necesarios.

No debemos asumir que un DTO HTTP es necesariamente igual al modelo del dominio.

La API y el dominio son contratos diferentes.

---

# 13. NestJS Modules

Cada módulo de negocio debe tener su módulo de NestJS.

Ejemplo:

```text
identity/
├── application/
├── domain/
├── infrastructure/
├── presentation/
└── identity.module.ts
```

El `identity.module.ts` se encarga de conectar las dependencias del módulo.

NestJS debe funcionar como framework de composición e infraestructura, no como lugar donde vive la lógica de negocio.

---

# 14. Common

`common/` contiene capacidades técnicas compartidas entre módulos.

Ejemplo:

```text
common/
├── config/
├── database/
├── errors/
├── http/
├── logging/
└── ...
```

## Importante

`common/` no debe convertirse en un contenedor de lógica de negocio.

### No colocar

```text
common/
├── user.entity.ts
├── role.entity.ts
├── membership.service.ts
└── appointment.service.ts
```

Si algo pertenece a un dominio, debe vivir dentro de ese módulo.

---

# 15. Prisma

Prisma se mantiene separado del dominio.

```text
back/
└── prisma/
    ├── schema.prisma
    ├── migrations/
    └── seed.ts
```

Las implementaciones de repositories pueden vivir dentro del módulo correspondiente:

```text
modules/
└── identity/
    └── infrastructure/
        └── persistence/
            └── prisma/
                └── user.prisma-repository.ts
```

El dominio no debe importar Prisma.

---

# 16. Frontend

La arquitectura del frontend es **Feature-Based Architecture**: el código se organiza por funcionalidades de negocio (features), no por tipos técnicos.

El frontend utiliza Next.js como framework.

```text
front/
└── src/
    ├── app/
    ├── modules/
    ├── shared/
    └── infrastructure/
```

---

# 17. App

`app/` pertenece principalmente a Next.js.

Su responsabilidad es:

* Routing
* Layouts
* Pages
* Loading states
* Error boundaries
* Route groups
* Server components cuando corresponda

Ejemplo:

```text
app/
├── login/
│   └── page.tsx
├── dashboard/
│   └── page.tsx
└── users/
    └── page.tsx
```

No debemos colocar toda la lógica de negocio dentro de `app`.

---

# 18. Modules del frontend

Los módulos representan funcionalidades de negocio.

Ejemplo:

```text
modules/
├── identity/
├── organization/
├── authorization/
├── audit/
└── administration/
```

Dentro de un módulo:

```text
identity/
├── api/
├── components/
├── hooks/
├── schemas/
├── services/
├── types/
└── views/
```

Cada módulo debe ser lo más autónomo posible.

---

# 19. Shared del frontend

`shared/` contiene elementos reutilizables y agnósticos del negocio.

Ejemplo:

```text
shared/
├── components/
├── hooks/
├── layouts/
├── utils/
├── types/
└── constants/
```

Ejemplos válidos:

```text
Button
Modal
DataTable
Pagination
useDebounce
formatDate
formatCurrency
```

No colocar componentes específicos de negocio en `shared`.

### Incorrecto

```text
shared/components/PatientCard.tsx
```

### Correcto

```text
modules/patients/components/PatientCard.tsx
```

---

# 20. Infrastructure del frontend

Contiene integraciones técnicas.

```text
infrastructure/
├── api/
├── auth/
└── storage/
```

Ejemplos:

* API client
* HTTP client
* Token management
* Local storage
* Session management
* External integrations

---

# 21. Regla de dependencia

Las dependencias deben apuntar hacia capas más internas.

Conceptualmente:

```text
Presentation
      ↓
Application
      ↓
Domain
      ↑
Infrastructure
```

Infrastructure puede implementar contratos definidos por Domain/Application.

Domain no depende de Infrastructure.

---

# 22. Regla de comunicación entre módulos

Los módulos deben comunicarse mediante contratos claros.

Evitar acceder directamente a la infraestructura interna de otro módulo.

### Incorrecto

```text
appointments/
    ↓
identity/infrastructure/prisma/user.prisma-repository.ts
```

### Preferir

```text
appointments/
    ↓
Identity application contract
    ↓
Identity
```

Un módulo no debe conocer los detalles internos de otro módulo.

---

# 23. Regla de comunicación entre bounded contexts

Cada módulo debe considerarse potencialmente independiente.

No asumir que dos módulos comparten automáticamente:

* Entities
* Repositories
* Services
* Database models
* Infrastructure

Si otro módulo necesita información, utilizar:

* Application contracts
* Interfaces
* Domain/Application events
* APIs internas
* DTOs/queries apropiadas

La comunicación debe ser explícita.

---

# 24. Naming

Utilizar nombres consistentes.

### Archivos

```text
user.entity.ts
user.repository.ts
user.prisma-repository.ts
create-user.use-case.ts
create-user.dto.ts
user.controller.ts
```

### Clases

```text
User
UserRepository
PrismaUserRepository
CreateUserUseCase
CreateUserDto
UserController
```

### Carpetas

Utilizar `kebab-case`:

```text
clinical-history/
refresh-token/
audit-event/
```

---

# 25. Use Cases

Los casos de uso deben representar acciones del sistema.

### Correcto

```text
create-user
update-user
assign-role
create-membership
refresh-session
record-audit-event
```

### Evitar

```text
user-service
general-service
common-service
manager-service
```

si estos servicios terminan acumulando múltiples responsabilidades.

Un Use Case debe tener una responsabilidad clara.

---

# 26. Reglas para crear un nuevo módulo

Antes de crear un módulo, responder:

1. ¿Representa una responsabilidad de negocio clara?
2. ¿Tiene reglas de negocio propias?
3. ¿Tiene entidades o conceptos propios?
4. ¿Tiene casos de uso propios?
5. ¿Tiene un lenguaje de dominio propio?
6. ¿Debe evolucionar independientemente de otros módulos?

Si la respuesta es sí, probablemente corresponde crear un módulo.

---

# 27. No crear módulos para todo

No todo debe convertirse en un módulo DDD.

Por ejemplo:

```text
dashboard
```

probablemente es una funcionalidad de presentación que consume información de varios dominios.

No necesariamente necesita:

```text
dashboard/domain/
dashboard/application/
dashboard/infrastructure/
```

De igual manera, componentes visuales deben permanecer en frontend.

---

# 28. Testing

Cada módulo debe tener tests cercanos a la responsabilidad que prueban.

Prioridad:

1. Domain
2. Application / Use Cases
3. Infrastructure
4. Presentation
5. End-to-End

Los tests de dominio deben poder ejecutarse sin base de datos ni framework.

Los casos de uso deben poder probarse utilizando mocks/fakes de sus dependencias.

---

# 29. Git

Cada repositorio tiene un único repositorio Git.

```text
platform/
└── .git/
```

No crear repositorios Git independientes dentro de:

```text
front/
back/
```

Frontend y backend son aplicaciones independientes dentro del mismo repositorio.

Cada aplicación mantiene su propio:

```text
package.json
package-lock.json
node_modules/
```

`node_modules/` nunca se versiona.

---

# 30. Branching

Utilizar branches por tarea o feature.

Ejemplo:

```text
main
│
├── feature/identity-create-user
├── feature/auth-refresh-token
├── feature/audit-events
└── feature/organization-memberships
```

Evitar trabajar directamente sobre `main`.

---

# 31. Pull Requests

Cada PR debe:

* Tener una responsabilidad clara.
* Ser lo suficientemente pequeño para revisar.
* Incluir tests cuando corresponda.
* No mezclar refactors innecesarios.
* Mantener la arquitectura establecida.
* Ser revisado por al menos otro miembro del equipo.

Evitar PRs como:

```text
Implement everything
```

Preferir:

```text
feat(identity): create user use case
feat(auth): implement refresh token
feat(audit): add audit event persistence
```

---

# 32. Commits

Utilizar Conventional Commits.

Ejemplos:

```text
feat(identity): add create user use case
feat(auth): implement refresh token
feat(audit): add audit event repository
fix(identity): validate duplicated email
refactor(organization): extract membership domain service
test(auth): add refresh token tests
docs(architecture): document module boundaries
chore(deps): update nest dependencies
```

---

# 33. Definition of Done

Una tarea no se considera terminada solamente porque "el código funciona".

Debe cumplir, cuando corresponda:

* [ ] Implementación terminada.
* [ ] Validaciones implementadas.
* [ ] Tests agregados.
* [ ] Lint sin errores.
* [ ] Formato correcto.
* [ ] No existen dependencias arquitectónicas incorrectas.
* [ ] Documentación actualizada si aplica.
* [ ] PR creado.
* [ ] PR revisado.
* [ ] Cambios integrados.

---

# 34. Regla fundamental para el equipo

Antes de crear código nuevo, identificar:

```text
¿A qué dominio pertenece?
        ↓
¿Es frontend o backend?
        ↓
¿Qué responsabilidad tiene?
        ↓
¿En qué capa debe vivir?
```

Para backend:

```text
¿Es regla de negocio?
        → domain

¿Es un caso de uso?
        → application

¿Es una integración tecnológica?
        → infrastructure

¿Es HTTP / entrada externa?
        → presentation
```

Para frontend:

```text
¿Es routing de Next.js?
        → app

¿Es funcionalidad de negocio?
        → modules

¿Es reutilizable y agnóstico?
        → shared

¿Es integración técnica?
        → infrastructure
```

---

# 35. Objetivo arquitectónico

La plataforma debe poder evolucionar de:

```text
platform
    +
odontologia
```

hacia:

```text
platform
    ├── odontologia
    ├── medical
    ├── veterinary
    └── other-verticals
```

sin tener que duplicar el Core.

Cada vertical debe implementar su propio dominio de negocio y consumir las capacidades comunes de `platform` mediante contratos definidos.

La escalabilidad buscada no depende únicamente de separar repositorios.

La prioridad es mantener:

* Límites claros.
* Bajo acoplamiento.
* Alta cohesión.
* Contratos explícitos.
* Independencia del dominio respecto a infraestructura.
* Módulos con responsabilidades claras.
* Capacidad de reemplazar infraestructura sin modificar el dominio.

---

# 36. Regla final

> **Organizar por dominio primero y por tecnología después.**

El código debe responder claramente:

> "¿A qué parte del negocio pertenece esto y qué responsabilidad tiene?"

antes de responder:

> "¿En qué carpeta técnica lo pongo?"

Esta regla debe guiar las decisiones de arquitectura durante el desarrollo.
