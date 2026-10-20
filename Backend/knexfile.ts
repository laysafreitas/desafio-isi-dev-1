import type { Knex } from 'knex';
import 'dotenv/config';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'db',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'user',
      password: process.env.DB_PASSWORD || 'userpassword',
      database: process.env.DB_NAME || 'liga_ficticia',
    },
    migrations: {
      directory: './src/database/migrations',
      extension: 'ts',
    },
  },
};

export default config;