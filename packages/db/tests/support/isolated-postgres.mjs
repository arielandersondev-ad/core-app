import { PGlite } from '@electric-sql/pglite';
import { nativeType } from '../../scripts/target-migration-sql.mjs';

const quote = (value) => `"${value.replaceAll('"', '""')}"`;
const qualify = (namespace, table) => `${quote(namespace)}.${quote(table)}`;
const literal = (value) =>
  typeof value === 'string'
    ? `'${value.replaceAll("'", "''")}'`
    : JSON.stringify(value);

/** Fresh, in-memory PostgreSQL only. Does not read DATABASE_URL or run migrations. */
export async function isolatedPostgres(contract, pgTypes) {
  const database = await PGlite.create();
  try {
    const ddl = [];
    const tables = [];
    for (const [namespace, space] of Object.entries(
      contract.storage.namespaces,
    )) {
      ddl.push(`CREATE SCHEMA IF NOT EXISTS ${quote(namespace)};`);
      for (const [name, table] of Object.entries(space.entries.table))
        tables.push({ namespace, name, ...table });
    }
    for (const table of tables) {
      const columns = Object.entries(table.columns).map(
        ([name, column]) =>
          `${quote(name)} ${nativeType(column)}${column.nullable ? '' : ' NOT NULL'}${column.default ? ` DEFAULT ${column.default.kind === 'function' ? column.default.expression : literal(column.default.value)}` : ''}`,
      );
      columns.push(
        `PRIMARY KEY (${table.primaryKey.columns.map(quote).join(',')})`,
      );
      for (const key of table.uniques)
        columns.push(`UNIQUE (${key.columns.map(quote).join(',')})`);
      for (const check of table.checks ?? [])
        columns.push(
          `CONSTRAINT ${quote(check.name)} CHECK (${check.expression})`,
        );
      ddl.push(
        `CREATE TABLE ${qualify(table.namespace, table.name)} (${columns.join(',')});`,
      );
    }
    let foreignKey = 0;
    for (const table of tables) {
      for (const index of table.indexes)
        ddl.push(
          `CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX ${quote(index.name)} ON ${qualify(table.namespace, table.name)} (${index.expression ?? index.columns.map(quote).join(',')})${index.where ? ` WHERE ${index.where}` : ''};`,
        );
      for (const key of table.foreignKeys ?? [])
        ddl.push(
          `ALTER TABLE ${qualify(table.namespace, table.name)} ADD CONSTRAINT ${quote(`fixture_fk_${foreignKey++}`)} FOREIGN KEY (${key.source.columns.map(quote).join(',')}) REFERENCES ${qualify(key.target.namespaceId, key.target.tableName)} (${key.target.columns.map(quote).join(',')})${key.onDelete === 'restrict' ? ' ON DELETE RESTRICT' : ''};`,
        );
    }
    await database.exec(ddl.join('\n'));
  } catch (error) {
    await database.close();
    throw error;
  }

  // Exercise the actual Prisma compiler, codecs and transaction driver. Only the
  // node-postgres transport is replaced; SQL and constraints run in PostgreSQL.
  const query = (text, values) =>
    database.query(text, values ?? [], {
      parsers: { 1082: pgTypes.getTypeParser(1082) },
    });
  const client = {
    connect: async () => {},
    end: async () => {},
    query(config, values) {
      if (typeof config === 'object' && typeof config.read === 'function') {
        const result = query(config.text, config.values);
        let offset = 0;
        return {
          read(size, callback) {
            result.then(({ rows }) => {
              const batch = rows.slice(offset, offset + size);
              offset += batch.length;
              callback(null, batch);
            }, callback);
          },
          close(callback) {
            callback();
          },
        };
      }
      return query(
        typeof config === 'string' ? config : config.text,
        typeof config === 'string' ? values : config.values,
      ).then((result) => ({
        ...result,
        rowCount: result.affectedRows ?? result.rows.length,
      }));
    },
  };
  return { client, database, close: () => database.close() };
}
