# Tratamientos

Tratamiento indicado a un paciente que puede extenderse por varias atenciones
(ej. ortodoncia). Guarda el **presupuesto acordado**; el **saldo se deriva**:

```
saldo = agreedPriceMinor − Σ Payment.amountMinor  (Payment COMPLETED del tratamiento)
```

Los pagos anulados no cuentan. Los importes son enteros en unidades menores
(10 000 Bs = `1000000`) con moneda de 3 letras (`BOB`).

## Rutas

Todas bajo `patients/:patientId/treatments`, con `@RequireModule('treatments')`.

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/` (filtro `status`, paginado) | `dentistry:treatments:read` |
| GET | `/:treatmentId` | `dentistry:treatments:read` |
| POST | `/` | `dentistry:treatments:create` |
| PATCH | `/:treatmentId` | `dentistry:treatments:update` |

La respuesta incluye `paidMinor` y `balanceMinor` (`null` si no hay presupuesto).

## Reglas

- Presupuesto y moneda van juntos; una moneda sin presupuesto se rechaza.
- El presupuesto nunca baja de lo ya cobrado (`BUDGET_BELOW_PAID`) ni se retira
  si hay pagos.
- Con pagos la moneda no cambia (`TREATMENT_CURRENCY_LOCKED`).
- `COMPLETED`, `DECLINED` y `CANCELED` son finales: solo lectura
  (`TREATMENT_CLOSED`). Finalizar con saldo pendiente es válido.
- `IN_PROGRESS` fija `startedAt`; `COMPLETED` fija `endedAt`.
- El profesional responsable es siempre la membresía de la sesión.
- El cambio se aplica bajo `lockTreatmentBalance`, el mismo bloqueo que debe usar
  el registro de pagos, para que un pago y un cambio de presupuesto simultáneos
  no dejen el saldo en negativo.

## Título

`title` es el nombre para mostrar (ej. "Ortodoncia"): obligatorio al crear,
recortado y de 1 a 120 caracteres; se puede corregir pero no vaciar
(`INVALID_TREATMENT_TITLE`). La columna admite nulo solo por los tratamientos
anteriores a este campo. `serviceName` es el servicio del catálogo, si lo hay.

## Pendiente

- Los pagos y el estado de cuenta (fase 4) viven en un módulo aparte.
