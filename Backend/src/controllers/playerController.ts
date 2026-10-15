import { Request, Response } from 'express';
import { db } from '../Config/database';
import { sanitizeText, calcularOverall, calcularValorBase, calcularValorMercado, roundCurrency, normalizeString, getPositionWeightOrder } from '../utils/helpers';

export const playerController = {
  async listar(req: Request, res: Response) {
    try {
      const { search, position, condition, free, club_id, min_age, max_age, min_value, max_value, sort, page = '1', limit = '10' } = req.query;

      let query = db('jogadores').whereNull('excluido_em');

      if (search) {
        const termo = normalizeString(String(search));
        query = query.whereRaw('LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(nome, "á", "a"), "é", "e"), "í", "i"), "ó", "o"), "ú", "u")) LIKE ?', [`%${termo}%`]);
      }
      if (position) query = query.where({ posicao: String(position) });
      if (condition) query = query.where({ condicao: String(condition) });
      if (free === 'true') query = query.whereNull('clube_id');
      if (free === 'false') query = query.whereNotNull('clube_id');
      if (club_id) query = query.where({ clube_id: Number(club_id) });
      if (min_age) query = query.where('idade', '>=', Number(min_age));
      if (max_age) query = query.where('idade', '<=', Number(max_age));

      const jogadoresRaw = await query;

      let jogadores = jogadoresRaw.map(j => {
        const overall = calcularOverall(j.posicao, { velocidade: j.velocidade, finalizacao: j.finalizacao, passe: j.passe, drible: j.drible, defesa: j.defesa, fisico: j.fisico });
        const market_value = calcularValorMercado(Number(j.valor_base), j.condicao, j.agilidade, j.idade);
        return { ...j, overall, market_value: Number(market_value), base_value: Number(j.valor_base) };
      });

      if (min_value) jogadores = jogadores.filter(j => j.market_value >= Number(min_value));
      if (max_value) jogadores = jogadores.filter(j => j.market_value <= Number(max_value));

      const sortStr = String(sort || 'name');
      jogadores.sort((a, b) => {
        const criterios = sortStr.split(',');
        for (const crit of criterios) {
          if (crit === 'value_desc') { if (b.market_value !== a.market_value) return b.market_value - a.market_value; }
          else if (crit === 'value_asc') { if (a.market_value !== b.market_value) return a.market_value - b.market_value; }
          else if (crit === 'age_desc') { if (b.idade !== a.idade) return b.idade - a.idade; }
          else if (crit === 'age_asc') { if (a.idade !== b.idade) return a.idade - b.idade; }
          else if (crit === 'position') {
            const pA = getPositionWeightOrder(a.posicao);
            const pB = getPositionWeightOrder(b.posicao);
            if (pA !== pB) return pA - pB;
          } else {
            const cmp = normalizeString(a.nome).localeCompare(normalizeString(b.nome));
            if (cmp !== 0) return cmp;
          }
        }
    
        const cmpNome = normalizeString(a.nome).localeCompare(normalizeString(b.nome));
        if (cmpNome !== 0) return cmpNome;
        return a.id - b.id;
      });

      const totalItems = jogadores.length;
      const pNum = Number(page);
      const lNum = Number(limit);
      const totalPages = Math.ceil(totalItems / lNum);
      const paginated = jogadores.slice((pNum - 1) * lNum, pNum * lNum);

      return res.json({
        data: paginated,
        meta: { page: pNum, limit: lNum, total_items: totalItems, total_pages: totalPages }
      });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  async cadastrar(req: Request, res: Response) {
    try {
      const { name, position, agility, age, pace, shooting, passing, dribbling, defending, physical, potential } = req.body;

      if (!name || !position || agility === undefined || age === undefined || pace === undefined || shooting === undefined || passing === undefined || dribbling === undefined || defending === undefined || physical === undefined || potential === undefined) {
        return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
      }

      const nomeLimpo = sanitizeText(name);
      const palavras = nomeLimpo.split(' ');
      if (palavras.length < 2 || nomeLimpo.length < 3 || nomeLimpo.length > 100 || /\d/.test(nomeLimpo)) {
        return res.status(400).json({ message: 'Nome inválido.' });
      }

      if (!['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'].includes(position)) {
        return res.status(400).json({ message: 'Posição inválida.' });
      }

      if (typeof agility !== 'number' || agility < 1 || agility > 100) return res.status(400).json({ message: 'Agilidade inválida.' });
      if (typeof age !== 'number' || age < 16 || age > 45) return res.status(400).json({ message: 'Idade inválida.' });
      if (age >= 35 && agility > 85) return res.status(400).json({ message: 'Agilidade máxima para 35+ é 85.' });

      const somaAtribs = pace + shooting + passing + dribbling + defending + physical;
      if (somaAtribs > 480) return res.status(400).json({ message: 'Soma dos atributos excede 480.' });

      const maiorAtrib = Math.max(pace, shooting, passing, dribbling, defending, physical);
      if (potential < 1 || potential > 99 || potential < maiorAtrib) {
        return res.status(400).json({ message: 'Potencial inválido.' });
      }
      if (age >= 33 && potential !== maiorAtrib) {
        return res.status(400).json({ message: 'Para 33+ anos, o potencial deve ser igual ao maior atributo.' });
      }

      const overall = calcularOverall(position, { velocidade: pace, finalizacao: shooting, passe: passing, drible: dribbling, defesa: defending, fisico: physical });
      const valor_base = calcularValorBase(overall, potential, age);
      const market_value = calcularValorMercado(valor_base, 'APTO', agility, age);

      const [id] = await db('jogadores').insert({
        nome: nomeLimpo,
        posicao: position,
        agilidade: agility,
        idade: age,
        valor_base,
        condicao: 'APTO',
        velocidade: pace,
        finalizacao: shooting,
        passe: passing,
        drible: dribbling,
        defesa: defending,
        fisico: physical,
        potencial: potential
      });

      res.setHeader('Location', `/api/v1/players/${id}`);
      return res.status(201).json({
        id,
        name: nomeLimpo,
        position,
        agility,
        age,
        condition: 'APTO',
        base_value:valor_base,
        market_value,
        pace,
        shooting,
        passing,
        dribbling,
        defending,
        physical,
        potential,
        overall,
        club_id: null
      });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  async consultar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const jogador = await db('jogadores')
      .where({ id })
      .whereNull('excluido_em')
      .first();
      if (!jogador) return res.status(404).json({ message: 'Jogador não encontrado.' });

      const overall = calcularOverall(jogador.posicao, { velocidade: jogador.velocidade, finalizacao: jogador.finalizacao, passe: jogador.passe, drible: jogador.drible, defesa: jogador.defesa, fisico: jogador.fisico });
      const market_value = calcularValorMercado(Number(jogador.valor_base), jogador.condicao, jogador.agilidade, jogador.idade);

      return res.json({
        id: jogador.id,
        name: jogador.nome,
        position: jogador.posicao,
        agility: jogador.agilidade,
        age: jogador.idade,
        condition: jogador.condicao,
        base_value: Number(jogador.valor_base),
        market_value: Number(market_value),
        pace: jogador.velocidade,
        shooting: jogador.finalizacao,
        passing: jogador.passe,
        dribbling: jogador.drible,
        defending: jogador.defesa,
        physical: jogador.fisico,
        potential: jogador.potencial,
        overall,
        club_id: jogador.clube_id
      });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  async editar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, position, agility, age } = req.body;

      const jogador = await db('jogadores').where({ id }).whereNull('excluido_em').first();
      if (!jogador) return res.status(404).json({ message: 'Jogador não encontrado.' });

      if (age < jogador.idade) {
        return res.status(409).json({ message: 'A idade não pode ser menor que a atual.' });
      }
      if (jogador.clube_id && position && position !== jogador.posicao) {
        return res.status(409).json({ message: 'Jogador com clube não pode mudar de posição.' });
      }

      const nomeLimpo = sanitizeText(name);
      await db('jogadores').where({ id }).update({
        nome: nomeLimpo,
        posicao: position || jogador.posicao,
        agilidade: agility,
        idade:age,
        atualizado_em: new Date()
      });

      return playerController.consultar(req, res);
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  async alterarCondicao(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { condition } = req.body;

      if (!['APTO', 'MAL_CONDICIONADO', 'DOENTE'].includes(condition)) {
        return res.status(400).json({ message: 'Condição inválida.' });
      }

      const jogador = await db('jogadores').where({ id }).whereNull('excluido_em').first();
      if (!jogador) return res.status(404).json({ message: 'Jogador não encontrado.' });

      if (jogador.condicao === 'DOENTE' && condition === 'APTO') {
        return res.status(409).json({ message: 'De DOENTE não vai direto para APTO.' });
      }

      await db('jogadores').where({ id }).update({ condicao: condition, atualizado_em: new Date() });

      if (condition === 'DOENTE' && jogador.clube_id) {
        await db('escalacoes').where({ clube_id: jogador.clube_id, jogador_id: id }).delete();
      }

      return playerController.consultar(req, res);
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  async excluir(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const jogador = await db('jogadores').where({ id }).whereNull('excluido_em').first();
      if (!jogador) return res.status(404).json({ message: 'Jogador não encontrado.' });

      if (jogador.clube_id) {
        return res.status(409).json({ message: 'Apenas jogadores livres podem ser excluídos.' });
      }

      await db('jogadores').where({ id }).update({ excluido_em: new Date() });
      return res.status(204).send();
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }
};