# Paginación de listados

La paginación se incorpora explícitamente en cada listado que la necesita.
No se aplica como interceptor global ni cambia endpoints por id o exportaciones.

- `page` comienza en 1; el valor predeterminado es 1.
- `pageSize` tiene valor predeterminado 20 y máximo HTTP 100.
- Ambos parámetros deben ser enteros positivos. Valores inválidos devuelven 400.
- `PaginationQueryDto`, en `common/presentation/dto`, concentra transformación y
  validación HTTP. Los DTO de listado pueden extenderlo.
- `PaginationInput`, `PaginatedResult<T>` y los valores predeterminados son
  independientes de NestJS y de `class-validator`.

El repositorio construye los filtros una sola vez y los utiliza para dos consultas:
el conteo sin paginación y los registros ordenados con `skip`/`take`. El conteo debe
conservar organización, permisos, búsqueda y todos los filtros de los registros.
Las dos lecturas no garantizan un mismo snapshot ante escrituras concurrentes.

La respuesta contiene `items` y `pagination` con `page`, `pageSize`, `totalItems`
y `totalPages`. El total de páginas se calcula con
`Math.ceil(totalItems / pageSize)`; nunca lo envía el cliente.

Sin coincidencias se devuelve `items: []`, `totalItems: 0` y `totalPages: 0`.
Si la página solicitada excede el rango, se devuelve una lista vacía conservando
la página solicitada y los totales reales.

El frontend reinicia `page` a 1 al cambiar búsqueda, filtros o tamaño. Una tabla
que recibe registros paginados del servidor no debe volver a paginarlos en memoria.

Pacientes es el primer consumidor: `GET /patients?page=2&pageSize=20`, con un
token Bearer de Dentistry. La organización procede del token verificado.
Su orden es `updatedAt DESC, createdAt DESC, lastName ASC, firstName ASC, id ASC`.
