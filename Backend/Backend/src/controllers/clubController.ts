import { Request, Response } from 'express';
import { db } from '../Config/database';
import { sanitizeText, normalizeString, calcularOverall, calcularValorMercado } from '../utils/helpers';

export const clubController = {
  async criar(req: Request, res: Response) {
    try {
      const { name, acronym } = req.body;
      if (!name || !acronym) return res.status(400).json({ message: 'Nome e sigla são obrigatórios.' });

      const nomeLimpo = sanitizeText(name);
      const totalClubes = await db('clubes').count('* as total').first();
      if (Number(totalClubes?.total || 0) >= 20) {
        return res.status(409).json({ message: 'Limite máximo de 20 clubes atingido.' });
      }

      const siglaUpper = acronym.toUpperCase();
      const [id] = await db('clubes').insert({
        nome: nomeLimpo,
        sigla: siglaUpper,
        caixa: 300.00
      });

      res.setHeader('Location', `/api/v1/clubs/${id}`);
      return res.status(201).json({
        id,
        name: nomeLimpo,
        acronym: siglaUpper,
        cash: 300.00,
        squad_value: 0.00,
        net_worth: 300.00
      });
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Nome ou sigla de clube já cadastrados.' });
      }
      return res.status(400).json({ message: err.message });
    }
  },

  async listar(req: Request, res: Response) {
    try {
      const { sort = 'name' } = req.query;
      const clubes = await db('clubes');

      const resultado = await Promise.all(clubes.map(async (c) => {
        const jogadores = await db('jogadores').where({ clube_id: c.id }).whereNull('excluido_em');
        let squad_value = 0;
        jogadores.forEach(j => {
          squad_value += calcularValorMercado(Number(j.valor_base), j.condicao, j.agilidade, j.idade);
        });
        const net_worth = Number(c.caixa) + squad_value;
        return {
          id: c.id,
          name: c.nome,
          acronym: c.sigla,
          cash: Number(c.caixa),
          squad_value: Number(squad_value.toFixed(2)),
          net_worth: Number(net_worth.toFixed(2))
        };
      }));

      resultado.sort((a, b) => {
        if (sort === 'net_worth_desc') return b.net_worth - a.net_worth;
        if (sort === 'net_worth_asc') return a.net_worth - b.net_worth;
        const cmp = normalizeString(a.name).localeCompare(normalizeString(b.name));
        if (cmp !== 0) return cmp;
        return a.id - b.id;
      });

      return res.json(resultado);
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  async consultar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const clube = await db('clubes').where({ id }).first();
      if (!clube) return res.status(404).json({ message: 'Clube não encontrado.' });

      const jogadores = await db('jogadores').where({ clube_id: id }).whereNull('excluido_em');
      
      let squad_value = 0;
      const playersFormatted = await Promise.all(jogadores.map(async (j) => {
        const overall = calcularOverall(j.posicao, { velocidade: j.velocidade, finalizacao: j.finalizacao, passe: j.passe, drible: j.drible, defesa: j.defesa, fisico: j.fisico });
        const market_value = calcularValorMercado(Number(j.valor_base), j.condicao, j.agilidade, j.idade);
        squad_value += market_value;

        const contrato = await db('contratos').where({ clube_id: id, jogador_id: j.id, situacao: 'ATIVO' }).first();
        let contractInfo = null;
        if (contrato) {
          const agora = new Date();
          const fimFidelidade = new Date(contrato.fidelidade_ate);
          const diffMs = fimFidelidade.getTime() - agora.getTime();
          const remaining_days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
          
          let penalty_rate = 0;
          if (remaining_days >= 1 && remaining_days <= 30) penalty_rate = 5;
          else if (remaining_days >= 31 && remaining_days <= 180) penalty_rate = 10;
          else if (remaining_days >= 181) penalty_rate = 20;

          contractInfo = {
            purchase_value: Number(contrato.valor_compra),
            loyalty_until: contrato.fidelidade_ate,
            remaining_days,
            penalty_rate
          };
        }

        return {
          id: j.id,
          name: j.nome,
          position: j.posicao,
          agility: j.agilidade,
          age: j.idade,
          condition: j.condicao,
          base_value: Number(j.valor_base),
          market_value,
          pace: j.velocidade,
          shooting: j.finalizacao,
          passing: j.passe,
          dribbling: j.drible,
          defending: j.defesa,
          physical: j.fisico,
          potential: j.potencial,
          overall,
          club_id: Number(id),
          contract: contractInfo
        };
      }));

      playersFormatted.sort((a, b) => {
        const posOrder: Record<string, number> = { GOL: 1, ZAG: 2, LAT: 3, MEI: 4, ATA: 5 };
        const pA = posOrder[a.position] || 99;
        const pB = posOrder[b.position] || 99;
        if (pA !== pB) return pA - pB;
        const cmpName = normalizeString(a.name).localeCompare(normalizeString(b.name));
        if (cmpName !== 0) return cmpName;
        return a.id - b.id;
      });

      const net_worth = Number(clube.caixa) + squad_value;

      return res.json({
        id: clube.id,
        name: clube.nome,
        acronym: clube.sigla,
        cash: Number(clube.caixa),
        squad_value: Number(squad_value.toFixed(2)),
        net_worth: Number(net_worth.toFixed(2)),
        players: playersFormatted
      });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }
};