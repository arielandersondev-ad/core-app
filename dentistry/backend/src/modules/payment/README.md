# Pagos

`Payment` es **dinero recibido**. No es presupuesto, cargo ni saldo: el
presupuesto vive en `Treatment.agreedPriceMinor` y el saldo se deriva
(ver [tratamientos](../treatment/README.md)).

Importes en unidades menores enteras (200 Bs = `20000`).

## Rutas

Todas bajo `patients/:patientId`, con `@RequireModule('payments')`.

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/payments` (filtros `treatmentId`, `status`; paginado) | `dentistry:payments:read` |
| GET | `/payments/:paymentId` | `dentistry:payments:read` |
| POST | `/payments/:paymentId/void` (`reason` obligatorio) | `dentistry:payments:void` |
| GET | `/treatments/:treatmentId/account` | `dentistry:payments:read` |
| POST | `/treatments/:treatmentId/payments` | `dentistry:payments:create` |
| GET | `/clinical-encounters/:encounterId/payment` | `dentistry:payments:read` |
| GET | `/clinical-encounters/:encounterId/payment-proposal` | `dentistry:payments:read` |
| POST | `/clinical-encounters/:encounterId/payment` | `dentistry:payments:create` |

- **Al tratamiento** (anticipo, pago al contado, abono entre visitas): sin
  atención asociada.
- **A una atención** (1:1): hereda la sucursal y la cita de la atención. Una
  atención sin pago es una prórroga; no existe ninguna fila.
- **Propuesta de cobro** (al finalizar la atención): solo lectura, no crea nada.
  Devuelve el total de los precios de los procedimientos no anulados
  (`proceduresTotalMinor`), los tratamientos de la atención (el propio y los de
  sus procedimientos planificados) con su saldo, `suggestedTreatmentId` y
  `suggestedAmountMinor`. El monto sugerido se acota al saldo del tratamiento y
  solo existe si la atención no está pagada ni anulada, el tratamiento admite
  cobros y la moneda coincide. Con varios tratamientos y ninguno propio, el
  tratamiento se elige al cobrar (`treatments[].suggestedAmountMinor`). Recepción
  confirma, edita al monto recibido (`POST .../payment`) u omite (prórroga).
- **Estado de cuenta**: presupuesto, cobrado, saldo y el saldo tras cada pago.
  Los pagos anulados aparecen, pero no restan ni llevan saldo.

## Reglas

- La moneda sale del tratamiento; si se envía otra, `PAYMENT_CURRENCY_MISMATCH`.
- Nunca se cobra más que el saldo (`PAYMENT_EXCEEDS_BALANCE`); el saldo exacto
  se puede saldar.
- El tratamiento necesita presupuesto (`TREATMENT_WITHOUT_BUDGET`) y no puede
  estar `DECLINED` ni `CANCELED` (`TREATMENT_NOT_PAYABLE`). Uno `COMPLETED` con
  saldo pendiente sí admite abonos.
- Una atención admite **un** pago vigente (`ENCOUNTER_ALREADY_PAID`); anular ese
  pago la libera. Una atención anulada no admite pagos.
- En el pago de una atención se puede elegir el tratamiento (`treatmentId`); por
  defecto es el de la atención. Sin tratamiento es un cobro suelto: exige
  `currency` y no toca ningún saldo.
- La sucursal: la de la atención, o `branchId`, o la única autorizada del
  usuario (`BRANCH_REQUIRED` si hay varias).
- `paidAt` puede ser pasada, no futura (`INVALID_PAID_AT`).
- Anular exige motivo (`VOID_REASON_REQUIRED`) y devuelve el dinero al saldo.
- El listado y el detalle solo muestran las sucursales autorizadas; el estado
  de cuenta de un tratamiento incluye todos sus pagos para que el saldo sea
  exacto.

## Concurrencia

El registro corre en una transacción que bloquea primero la atención
(`lockEncounterPayment`) y luego el tratamiento (`lockTreatmentBalance`, el mismo
que usa el cambio de presupuesto), siempre en ese orden. Lee el dinero recibido
bajo el bloqueo, valida y guarda. El índice único parcial
`payment_encounter_uidx` (migración de HAG-11) es la última barrera del 1:1.

Anular una atención con pago vigente responde 409 `ENCOUNTER_HAS_PAYMENT`
(módulo de atenciones): la anulación toma el mismo bloqueo `lockEncounterPayment`.

## Pendiente

- Aplicar la migración de HAG-11 antes de usar el 1:1 y los precios de
  procedimiento contra una base real.
