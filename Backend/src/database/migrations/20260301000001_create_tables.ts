import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('clubes', (table) => {
    table.increments('id').primary();
    table.string('nome', 60).notNullable().unique();
    table.string('sigla', 3).notNullable().unique();
    table.decimal('caixa', 10, 2).notNullable().defaultTo(300.00);
    table.string('formacao', 5).nullable();
    table.timestamp('criado_em').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('jogadores', (table) => {
    table.increments('id').primary();
    table.string('nome', 100).notNullable();
    table.string('posicao', 3).notNullable(); 
    table.integer('agilidade').notNullable();
    table.integer('idade').notNullable();
    table.decimal('valor_base', 6, 2).notNullable();
    table.string('condicao', 20).notNullable().defaultTo('APTO'); 
    table.integer('clube_id').unsigned().nullable().references('id').inTable('clubes').onDelete('SET NULL');
    table.integer('velocidade').notNullable();
    table.integer('finalizacao').notNullable();
    table.integer('passe').notNullable();
    table.integer('drible').notNullable();
    table.integer('defesa').notNullable();
    table.integer('fisico').notNullable();
    table.integer('potencial').notNullable();
    table.timestamp('excluido_em').nullable();
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.timestamp('atualizado_em').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('contratos', (table) => {
    table.increments('id').primary();
    table.integer('jogador_id').unsigned().notNullable().references('id').inTable('jogadores');
    table.integer('clube_id').unsigned().notNullable().references('id').inTable('clubes');
    table.decimal('valor_compra', 6, 2).notNullable();
    table.timestamp('fidelidade_ate').notNullable();
    table.string('situacao', 12).notNullable().defaultTo('ATIVO');
    table.timestamp('iniciado_em').defaultTo(knex.fn.now());
    table.timestamp('encerrado_em').nullable();
  });

  await knex.schema.createTable('transacoes', (table) => {
    table.increments('id').primary();
    table.integer('clube_id').unsigned().notNullable().references('id').inTable('clubes');
    table.integer('jogador_id').unsigned().notNullable();
    table.string('nome_jogador', 100).notNullable();
    table.string('tipo', 6).notNullable();
    table.decimal('valor', 6, 2).notNullable();
    table.decimal('taxa', 6, 2).notNullable().defaultTo(0.00);
    table.decimal('multa', 6, 2).notNullable().defaultTo(0.00);
    table.decimal('lucro', 7, 2).nullable();
    table.decimal('variacao_caixa', 8, 2).notNullable();
    table.timestamp('criado_em').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('escalacoes', (table) => {
    table.integer('clube_id').unsigned().notNullable().references('id').inTable('clubes');
    table.integer('jogador_id').unsigned().notNullable().references('id').inTable('jogadores');
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.primary(['clube_id', 'jogador_id']);
    table.unique(['jogador_id']);
  });

  await knex.schema.createTable('partidas', (table) => {
    table.increments('id').primary();
    table.integer('mandante_id').unsigned().notNullable().references('id').inTable('clubes');
    table.integer('visitante_id').unsigned().notNullable().references('id').inTable('clubes');
    table.integer('gols_mandante').notNullable();
    table.integer('gols_visitante').notNullable();
    table.string('formacao_mandante', 5).notNullable();
    table.string('formacao_visitante', 5).notNullable();
    table.timestamp('jogada_em').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('duelos_partida', (table) => {
    table.increments('id').primary();
    table.integer('partida_id').unsigned().notNullable().references('id').inTable('partidas').onDelete('CASCADE');
    table.integer('ordem').notNullable(); // 1 a 6
    table.integer('clube_atacante_id').unsigned().notNullable().references('id').inTable('clubes');
    table.integer('atacante_id').unsigned().notNullable();
    table.integer('defensor_id').unsigned().notNullable();
    table.string('nome_atacante', 100).notNullable();
    table.string('nome_defensor', 100).notNullable();
    table.string('posicao_atacante', 3).notNullable();
    table.string('posicao_defensor', 3).notNullable();
    table.string('condicao_atacante', 20).notNullable();
    table.string('condicao_defensor', 20).notNullable();
    table.string('atributo_ataque', 10).notNullable();
    table.string('atributo_defesa', 10).notNullable();
    table.integer('valor_ataque').notNullable();
    table.integer('valor_defesa').notNullable();
    table.boolean('gol').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('duelos_partida');
  await knex.schema.dropTableIfExists('partidas');
  await knex.schema.dropTableIfExists('escalacoes');
  await knex.schema.dropTableIfExists('transacoes');
  await knex.schema.dropTableIfExists('contratos');
  await knex.schema.dropTableIfExists('jogadores');
  await knex.schema.dropTableIfExists('clubes');
}