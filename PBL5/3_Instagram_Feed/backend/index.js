import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  user: 'postgres',          // your PostgreSQL username
  host: 'localhost',
  database: 'demo',          // your database name
  password: '0987',  // your PostgreSQL password
  port: 5432
});

await client.connect();

const res = await client.query('SELECT NOW()');
console.log(res.rows);

await client.end();
