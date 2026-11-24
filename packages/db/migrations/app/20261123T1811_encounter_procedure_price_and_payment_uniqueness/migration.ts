#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/60caa8643e70224c6142a506aaabf149485d3e2f295b0d885866c0d2856a4216/contract';
import startContract from '../../snapshots/60caa8643e70224c6142a506aaabf149485d3e2f295b0d885866c0d2856a4216/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/d9c33e240f0d2f5beccb00d890466bbf7be0851aafeb5b7fc2c9c4da565b2634/contract';
import endContract from '../../snapshots/d9c33e240f0d2f5beccb00d890466bbf7be0851aafeb5b7fc2c9c4da565b2634/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'dentistry',
        table: 'ClinicalEncounterProcedure',
        column: col('currency', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'dentistry',
        table: 'ClinicalEncounterProcedure',
        column: col('priceMinor', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'ClinicalEncounterProcedure',
        constraint: 'encounter_procedure_currency_8daa14c4',
        expression:
          '("priceMinor" IS NULL AND "currency" IS NULL) OR ("priceMinor" IS NOT NULL AND "currency" IS NOT NULL AND "currency" ~ \'^[A-Z]{3}$\')',
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'ClinicalEncounterProcedure',
        constraint: 'encounter_procedure_price_11edf7e3',
        expression: '"priceMinor" IS NULL OR "priceMinor" >= 0',
      }),
      this.createIndex({
        schema: 'dentistry',
        table: 'Payment',
        index: 'payment_encounter_uidx_9d5b8137',
        columns: ['organizationId', 'clinicalEncounterId'],
        extras: {
          where: '"clinicalEncounterId" IS NOT NULL AND "status" = \'COMPLETED\'',
          unique: true,
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
