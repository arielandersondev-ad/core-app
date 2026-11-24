#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/d9c33e240f0d2f5beccb00d890466bbf7be0851aafeb5b7fc2c9c4da565b2634/contract';
import startContract from '../../snapshots/d9c33e240f0d2f5beccb00d890466bbf7be0851aafeb5b7fc2c9c4da565b2634/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/f31890d6c39515af4baf14fbf3ded29f19e7aa218e7fb98e0893678994174c6a/contract';
import endContract from '../../snapshots/f31890d6c39515af4baf14fbf3ded29f19e7aa218e7fb98e0893678994174c6a/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'dentistry',
        table: 'Treatment',
        column: col('title', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addCheckConstraint({
        schema: 'dentistry',
        table: 'Treatment',
        constraint: 'treatment_title_814f6407',
        expression: '"title" IS NULL OR (length(btrim("title")) > 0 AND length("title") <= 120)',
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
