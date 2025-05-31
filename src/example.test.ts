import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Entity, MikroORM, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
class UserNumber {

  @PrimaryKey({generated: 'identity'})
  id!: number;

  @Property()
  name: string;

  @Property({ unique: true })
  email: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }

}

@Entity()
class UserBigInt {
  @PrimaryKey({generated: 'identity'})
  id!: bigint;

  @Property()
  name!: string;
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    driver: PostgreSqlDriver,
    dbName: 'postgres',
    port: 35432,
    password: 'example',
    entities: [UserNumber, UserBigInt],
    debug: ['query', 'query-params'],
    allowGlobalContext: true, // only for testing
  });
});

afterAll(async () => {
  await orm.close(true);
});

test('id as number/bigint primary key with generated identity', async () => {
  const schemaDump = await orm.schema.getCreateSchemaSQL();
  
  expect(schemaDump).toContain('create table "user_number" ("id" int generated always as identity primary key');
  expect(schemaDump).toContain('create table "user_big_int" ("id" bigint generated always as identity primary key');
});
