# Plan de implementación — presupuesto, abonos y saldo (ortodoncia)

> Fecha: 2026-11-23 · Estado: fase 1 preparada en local (sin commit ni migración aplicada)

## 1. Requerimiento del cliente

Registrar un paciente de ortodoncia con un monto a pagar (ej. 10 000 Bs). Si no puede pagar el total, deja un adelanto (ej. 200 Bs) y en cada encuentro/cita se registran los abonos y el saldo de su cartera.

## 2. Modelo acordado

| Concepto | Dónde vive |
|---|---|
| Presupuesto | `Treatment.agreedPriceMinor` + `currency` |
| Anticipo, pago al contado, abono entre visitas | `Payment` con `treatmentId`, sin encuentro |
| Abono de un encuentro | `Payment` con `clinicalEncounterId` (relación 1:1) |
| Prórroga (encuentro sin pago) | No existe fila de `Payment` |
| Precio nominal del procedimiento | `ClinicalEncounterProcedure.priceMinor` + `currency` (opcionales) |
| Saldo | Derivado: `agreedPriceMinor` − suma de `Payment` `COMPLETED` del tratamiento |

Reglas:

- Al finalizar un encuentro se **propone** el monto como la suma de los precios de sus procedimientos no anulados. Recepción lo confirma, lo edita al monto realmente recibido o lo omite (prórroga). Lo realizado frente a lo cobrado se muestra en el encuentro, pero solo el dinero recibido mueve el saldo.
- Un `Payment` reduce el saldo de **un solo** tratamiento. En un encuentro con procedimientos de varios tratamientos, el tratamiento se elige al cobrar.
- El 1:1 se garantiza con un índice único parcial sobre los pagos `COMPLETED`; anular un pago libera el encuentro.
- Importes en unidades menores enteras (10 000 Bs = 1 000 000), moneda de tres letras.

## 3. Plan comercial

Se usa el plan estándar existente. Ya tiene `payments: true`; se activa `treatments: true` desde Core y se **reasigna** a la organización, porque cada asignación conserva una copia (`entitlementsSnapshot`). Los límites `filesPerPatient` y `fileStorageBytes` no se tocan.

## 4. Fases

| # | Fase | Contenido | Estado |
|---|---|---|---|
| 1 | Contrato `packages/db` | Precio en `ClinicalEncounterProcedure`; índice único parcial `payment_encounter_uidx`; migración `20261123T1811_encounter_procedure_price_and_payment_uniqueness` | Preparada en local; sin aplicar |
| 2 | Core: plan y permisos | `treatments: true`, reasignación y permisos `dentistry:payments:*`, `dentistry:treatments:*` y `dentistry:encounters:*` | Pendiente |
| 3 | Backend de tratamientos | Crear y editar con presupuesto y moneda; detalle con presupuesto, pagado y saldo; `@RequireModule('treatments')` | Implementada en `dentistry/backend/src/modules/treatment`; 104/104 pruebas |
| 4 | Backend de pagos | Pago al tratamiento, pago del encuentro (1:1), anulación con motivo, estado de cuenta; saldo comprobado dentro de la transacción con bloqueo | Implementada en `dentistry/backend/src/modules/payment` (HAG-14); falta probarla contra una base real |
| 5 | Integración con encuentros | Precio en el procedimiento; propuesta de pago al finalizar; no anular un encuentro con pago activo | Implementada (HAG-15): precio en procedimientos y `proceduresTotal` en la atención (`clinical-encounter`), `GET .../payment-proposal` (`payment`) y 409 `ENCOUNTER_HAS_PAYMENT` al anular; falta probarla contra una base real |
| 6 | Frontend | Reemplazar mocks de `Treatments`, `Payments` y `RegisterPayment`; estado de cuenta en el paciente; paso de cobro; campo de precio | Pendiente |
| 7 | Cierre | Diccionario, `docs/plan-starter/README.md` (desactualizado) y prueba de punta a punta | Pendiente |

## 5. Decisiones abiertas (valor por defecto)

1. Sobrepago: se bloquea un pago mayor al saldo.
2. El presupuesto es editable, nunca por debajo de lo ya pagado; un descuento es editar el presupuesto.
3. Una sola moneda por tratamiento; pagos y precios deben coincidir.
4. Se permite el cobro sin tratamiento (no afecta ningún saldo).
5. Medios de pago: efectivo, transferencia, QR y tarjeta.
6. Quién registra o anula pagos (recepción, dentista o propietario): **sin definir**; condiciona los permisos de la fase 2.
7. Recibo imprimible: fuera de la v1.
8. IDs de ticket `HAG-XX` para los commits: **sin asignar**.

## 6. Restricciones del repositorio

- Todo cambio de modelo sigue el ciclo de `packages/db/README.md`; nada de SQL directo contra Neon ni `db:update` contra la base compartida.
- Un commit atómico por ticket con `tsc` sin errores y tests en verde.
- La migración nueva se apoya en `20261105T1833_dentistry_clinical_procedures`. El diccionario la daba por no aplicada; hay que comprobar su estado con `migration:status` antes de aplicar ninguna, y aplicarlas en orden.
