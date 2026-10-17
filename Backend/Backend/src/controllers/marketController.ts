import { Request, Response } from 'express';
import { db } from '../Config/database';
import { calcularValorMercado, roundCurrency } from '../utils/helpers';

export const marketController = {
  async comprar(req: Request, res: Response) {
    try {
      const { id: playerId } = req.params;
      const { club_id, loyalty_until } = req.body;

      if (!club_id || !loyalty_until) return res.status(400).json({ message: 'club_id e loyalty_until são obrigatórios.' });

      const clube = await db('clubes').where({ id: club_id }).first();
      if (!clube) return res.status(404).json({ message: 'Clube não encontrado.' });

      const jogador = await db('jogadores').where({ id: playerId }).whereNull('excluido_em').first();
      if (!jogador) return res.status(404).json({ message: 'Jogador não encontrado.' });

      if (jogador.clube_id !== null) {
        return res.status(409).json({ message: 'O jogador precisa estar livre.' });
      }

      const jaVendeu = await db('transacoes').where({ club_id, jenis: 'VENDA', jogador_id: playerId }).first();
      if (jaVendeu) {
        return res.status(409).json({ message: 'O clube não pode recomprar um jogador que ele mesmo vendeu.' });
      }

      const totalElenco = await db('jogadores').where({ club_id }).whereNull('excluido_em').count('* as total').first();
      if (Number(totalElenco?.total || 0) >= 12) {
        return res.status(409).json({ message: 'Elenco completo (máximo de 12 jogadores).' });
      }

      const market_value = calcularValorMercado(Number(jogador.valor_base), jogador.condicao, jogador.agilidade, jogador.idade);
      
      let taxa = 0;
      if (market_value > 30.00) {
        taxa = roundCurrency(market_value * 0.05);
      }
      const custoTotal = roundCurrency(market_value + taxa);
      const limiteCaixa = Number(clube.caixa) * 0.50;

      if (custoTotal > limiteCaixa) {
        return res.status(409).json({ message: `Custo total (${custoTotal}) excede 50% do caixa (${limiteCaixa}).` });
      }

      const novoCaixa = roundCurrency(Number(clube.caixa) - custoTotal);

      const resultado = await db.transaction(async (trx) => {
        await trx('clubes').where({ id: club_id }).update({ caixa: novoCaixa });
        await trx('jogadores').where({ id: playerId }).update({ club_id });

        const [contratoId] = await trx('contratos').insert({
          club_id,
          jogador_id: playerId,
          valor_compra: market_value,
          fidelidade_ate: loyalty_until,
          situacao: 'ATIVO'
        });

        const [transacaoId] = await trx('transacoes').insert({
          club_id,
          jogador_id: playerId,
          nome_jogador: jogador.nome,
          tipo: 'COMPRA',
          valor: market_value,
          taxa,
          multa: 0.00,
          lucro: null,
          variacao_caixa: -custoTotal
        });

        return { contratoId, transacaoId, novoCaixa };
      });

      return res.json({
        id: resultado.transacaoId,
        club_id: Number(club_id),
        player_id: Number(playerId),
        player_name: jogador.nome,
        type: 'COMPRA',
        value: market_value,
        fee: taxa,
        penalty: 0.00,
        profit: null,
        cash_change: -roundCurrency(market_value + taxa),
        created_at: new Date().toISOString(),
        contract: {
          purchase_value: market_value,
          loyalty_until,
          status: 'ATIVO'
        },
        club_cash: resultado.novoCaixa
      });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  async vender(req: Request, res: Response) {
    try {
      const { id: playerId } = req.params;

      const jogador = await db('jogadores').where({ id: playerId }).whereNull('excluido_em').first();
      if (!jogador || !jogador.clube_id) {
        return res.status(409).json({ message: 'Jogador inválido ou livre.' });
      }

      const club_id = jogador.clube_id;
      const clube = await db('clubes').where({ id: club_id }).first();
      const contrato = await db('contratos').where({ club_id, jogador_id: playerId, situacao: 'ATIVO' }).first();

      const market_value = calcularValorMercado(Number(jogador.valor_base), jogador.condicao, jogador.agilidade, jogador.idade);
      const agora = new Date();

      let remaining_days = 0;
      let penalty = 0.00;
      let penalty_rate = 0;
      let situacaoContrato = 'ENCERRADO';

      if (contrato) {
        const fimFidelidade = new Date(contrato.fidelidade_ate);
        const diffMs = fimFidelidade.getTime() - agora.getTime();
        if (diffMs > 0) {
          remaining_days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          if (remaining_days >= 1 && remaining_days <= 30) penalty_rate = 5;
          else if (remaining_days >= 31 && remaining_days <= 180) penalty_rate = 10;
          else if (remaining_days >= 181) penalty_rate = 20;

          penalty = roundCurrency(market_value * (penalty_rate / 100));
          if (penalty > 10.00) penalty = 10.00;
          situacaoContrato = 'RESCINDIDO';
        }
      }

      let lucro = 0;
      let comissao = 0;
      if (contrato) {
        lucro = roundCurrency(market_value - Number(contrato.valor_compra));
        if (lucro > 0) {
          if (lucro <= 10.00) {
            comissao = roundCurrency(lucro * 0.10);
          } else {
            comissao = roundCurrency((10.00 * 0.10) + ((lucro - 10.00) * 0.20));
          }
        }
      }

      const creditoCaixa = roundCurrency(market_value - penalty - comissao);
      const novoCaixa = roundCurrency(Number(clube.caixa) + creditoCaixa);

      await db.transaction(async (trx) => {
        await trx('clubes').where({ id: club_id }).update({ caixa: novoCaixa });
        await trx('jogadores').where({ id: playerId }).update({ clube_id: null });
        if (contrato) {
          await trx('contratos').where({ id: contrato.id }).update({ situacao: situacaoContrato, encerrado_em: agora });
        }
       
        await trx('escalacoes').where({ club_id, jogador_id: playerId }).delete();

        await trx('transacoes').insert({
          club_id,
          jogador_id: playerId,
          nome_jogador: jogador.nome,
          tipo: 'VENDA',
          valor: market_value,
          taxa: comissao,
          multa: penalty,
          lucro: lucro,
          variacao_caixa: creditoCaixa
        });
      });

      return res.json({
        club_id,
        player_id: Number(playerId),
        player_name: jogador.nome,
        type: 'VENDA',
        value: market_value,
        fee: comissao,
        penalty,
        profit: lucro,
        cash_change: creditoCaixa,
        created_at: agora.toISOString(),
        purchase_value: contrato ? Number(contrato.valor_compra) : 0,
        remaining_days,
        penalty_rate,
        contract_status: situacaoContrato,
        club_cash: novoCaixa
      });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  async historicoTransacoes(req: Request, res: Response) {
    try {
      const { id: clubId } = req.params;
      const { type, player_id } = req.query;

      let query = db('transacoes').where({ clube_id: clubId });
      if (type) {
        const tipos = String(type).split(',');
        query = query.whereIn('tipo', tipos);
      }
      if (player_id) {
        const jogadorExiste = await db('jogadores').where({ id: player_id }).first();
        if (!jogadorExiste) return res.status(404).json({ message: 'Jogador não encontrado.' });
        query = query.where({ jogador_id: player_id });
      }

      const transacoes = await query.orderBy('criado_em', 'desc').orderBy('id', 'desc');

      let total_spent = 0;
      let total_received = 0;
      let total_fees = 0;
      let total_penalties = 0;
      let total_profit = 0;

      const dataFormatted = transacoes.map(t => {
        if (t.tipo === 'COMPRA') {
          total_spent += Number(t.valor) + Number(t.taxa);
        } else {
          total_received += Number(t.variacao_caixa);
          total_profit += Number(t.lucro || 0);
        }
        total_fees += Number(t.taxa);
        total_penalties += Number(t.multa);

        return {
          id: t.id,
          club_id: t.clube_id,
          player_id: t.jogador_id,
          player_name: t.nome_jogador,
          type: t.tipo,
          value: Number(t.valor),
          fee: Number(t.taxa),
          penalty: Number(t.multa),
          profit: t.lucro !== null ? Number(t.lucro) : null,
          cash_change: Number(t.variacao_caixa),
          created_at: t.criado_em
        };
      });

      return res.json({
        data: dataFormatted,
        summary: {
          total_spent: roundCurrency(total_spent),
          total_received: roundCurrency(total_received),
          total_fees: roundCurrency(total_fees),
          total_penalties: roundCurrency(total_penalties),
          total_profit: roundCurrency(total_profit)
        }
      });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }
};