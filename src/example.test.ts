import {Entity, EntityManager, ManyToOne, MikroORM, PrimaryKey, Property} from '@mikro-orm/sqlite';

@Entity()
class Author {
  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  name!: string;
}

@Entity()
class Book {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => Author)
  author!: Author;

  @Property()
  title!: string;
}

let orm: MikroORM;
let em: EntityManager;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Author, Book],
    debug: ['query', 'query-params'],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
  em = orm.em.fork();
});

afterAll(async () => {
  await orm.close(true);
});

test('upsert, flush via find concurrently', async () => {
  await em.transactional(async em => {
    const pages = [
      [{id: 1, name: 'Author A'}, {id: 2, name: 'Author B'}],
      [{id: 3, name: 'Author C'}, {id: 4, name: 'Author D'}]
    ];

    for (const page of pages) {
        await Promise.all(page.map(async (rawAuthor) => {
          const author = em.create(Author, {id: rawAuthor.id, name: rawAuthor.name});
          await em.upsert(Author, author);


          await em.find(Book, {author});

          const book = em.create(Book, { author, title: `Book ${rawAuthor.id}`});
          await em.upsert(Book, book);
        }));
    }
  });
});
