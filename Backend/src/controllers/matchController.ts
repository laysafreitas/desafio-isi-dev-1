import { Request, Response } from 'express';
import { db } from '../Config/database';
import { roundHalfUp } from '../utils/helpers';

export const matchController = {
  async escalar(req: Request, res: Response) {
    try {
      const { id: clubId } = req.params;
      const { formation, player_ids } = req.body;

      const clube = await db('clubes').where({ id: clubId }).first();
      if (!clube) return res.status(404).json({ message: 'Clube não encontrado.' });

      if (!['3-1', '2-2', '2-1-1', '1-2-1'].includes(formation)) {
        return res.status(400).json({ message: 'Formação inválida.' });
      }

      if (!Array.isArray(player_ids) || player_ids.length !== 5) {
        return res.status(400).json({ message: 'Devem ser informados exatamente 5 IDs de titulares.' });
      }

      if (new Set(player_ids).size !== 5) {
        return res.status(400).json({ message: 'IDs de titulares não podem ser repetidos.' });
      }

      const jogadores = await db('jogadores').whereIn('id', player_ids).whereNull('excluido_em');
      if (jogadores.length !== 5) {
        return res.status(404).json({ message: 'Um ou mais jogadores não foram encontrados.' });
      }

      for (const j of jogadores) {
        if (j.clube_id !== Number(clubId)) {
          return res.status(409).json({ message: `O jogador ${j.nome} não pertence ao elenco do clube.` });
        }
        if (j.condicao === 'DOENTE') {
          return res.status(409).json({ message: `O jogador ${j.nome} está DOENTE e não pode ser escalado.` });
        }
      }

      const gols = jogadores.filter(j => j.posicao === 'GOL');
      if (gols.length !== 1) {
        return res.status(409).json({ message: 'A escalação exige exatamente 1 Goleiro (GOL).' });
      }

      const deFesaOuLat = jogadores.filter(j => j.posicao === 'ZAG' || j.posicao === 'LAT').length;
      const meis = jogadores.filter(j => j.posicao === 'MEI').length;
      const atas = jogadores.filter(j => j.posicao === 'ATA').length;

      let valido = false;
      if (formation === '3-1' && deFesaOuLat === 3 && meis === 0 && atas === 1) valido = true;
      if (formation === '2-2' && deFesaOuLat === 2 && meis === 0 && atas === 2) valido = true;
      if (formation === '2-1-1' && deFesaOuLat === 2 && meis === 1 && atas === 1) valido = true;
      if (formation === '1-2-1' && deFesaOuLat === 1 && meis === 2 && atas === 1) valido = true;

      if (!valido) {
        return res.status(409).json({ message: 'As posições dos jogadores de linha não fecham com a formação escolhida.' });
      }

      await db.transaction(async (trx) => {
        await trx('clubes').where({ id: clubId }).update({ formacao: formation });
        await trx('escalacoes').where({ clube_id: clubId }).delete();
        const inserts = player_ids.map((pid: number) => ({ clube_id: clubId, jogador_id: pid }));
        await trx('escalacoes').insert(inserts);
      });

      return res.json({ club_id: Number(clubId), formation, complete: true, players: jogadores });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  async jogarPartida(req: Request, res: Response) {
    try {
      const { home_club_id, away_club_id } = req.body;
      if (!home_club_id || !away_club_id || home_club_id === away_club_id) {
        return res.status(400).json({ message: 'IDs de clubes inválidos ou iguais.' });
      }

      const mandante = await db('clubes').where({ id: home_club_id }).first();
      const visitante = await db('clubes').where({ id: away_club_id }).first();
      if (!mandante || !visitante) return res.status(404).json({ message: 'Clube mandante ou visitante não encontrado.' });

      if (!mandante.formacao || !visitante.formacao) {
        return res.status(409).json({ message: 'Um dos clubes não possui escalação completa.' });
      }

      const getTitulares = async (clubeId: number) => {
        const escalados = await db('escalacoes').where({ clube_id: clubeId }).select('jogador_id');
        const ids = escalados.map(e => e.jogador_id);
        const jogs = await db('jogadores').whereIn('id', ids).whereNull('excluido_em');
        if (jogs.length !== 5) throw new Error('Escalação incompleta.');

        jogs.sort((a, b) => {
          const posOrder: Record<string, number> = { GOL: 1, ZAG: 2, LAT: 3, MEI: 4, ATA: 5 };
          const pA = posOrder[a.posicao] || 99;
          const pB = posOrder[b.posicao] || 99;
          if (pA !== pB) return pA - pB;
          const cmp = a.nome.localeCompare(b.nome);
          if (cmp !== 0) return cmp;
          return a.id - b.id;
        });
        return jogs;
      };

      const titularesMandante = await getTitulares(home_club_id);
      const titularesVisitante = await getTitulares(away_club_id);

      const getAtributoComCondicao = (jogador: any, atributo: string) => {
        const valorOriginal = jogador[atributo];
        if (jogador.condicao === 'MAL_CONDICIONADO') {
          return roundHalfUp(valorOriginal * 0.85);
        }
        return valorOriginal;
      };

      
      const duelosConfig = [
        { ordem: 1, atacanteTime: 'casa', atIdx: 4, defIdx: 0, atAttr: 'finalizacao', defAttr: 'defesa' }, // 4º linha x Goleiro
        { ordem: 2, atacanteTime: 'casa', atIdx: 3, defIdx: 1, atAttr: 'passe', defAttr: 'defesa' },       // 3º linha x 1º linha def
        { ordem: 3, atacanteTime: 'casa', atIdx: 2, defIdx: 2, atAttr: 'drible', defAttr: 'defesa' },      // 2º linha x 2º linha def
        { ordem: 4, atacanteTime: 'fora', atIdx: 4, defIdx: 0, atAttr: 'finalizacao', defAttr: 'defesa' }, // Visitante 4º x Goleiro Casa
        { ordem: 5, atacanteTime: 'fora', atIdx: 3, defIdx: 1, atAttr: 'passe', defAttr: 'defesa' },       // Visitante 3º x Casa 1º
        { ordem: 6, atacanteTime: 'fora', atIdx: 2, defIdx: 2, atAttr: 'drible', defAttr: 'defesa' }       // Visitante 2º x Casa 2º
      ];

      let golsMandante = 0;
      let golsVisitante = 0;
      const duelosResultado: any[] = [];

      for (const d of duelosConfig) {
        const timeAtacante = d.atacanteTime === 'casa' ? titularesMandante : titularesVisitante;
        const timeDefensor = d.atacanteTime === 'casa' ? titularesVisitante : titularesMandante;

        const atacante = timeAtacante[d.atIdx];
        const defensor = timeDefensor[d.defIdx];

        const valAtaque = getAtributoComCondicao(atacante, d.atAttr);
        const valDefesa = getAtributoComCondicao(defensor, d.defAttr);

        const ehGol = valAtaque > valDefesa;
        if (d.atacanteTime === 'casa' && ehGol) golsMandante++;
        if (d.atacanteTime === 'fora' && ehGol) golsVisitante++;

        duelosResultado.push({
          ordem: d.ordem,
          clube_atacante_id: d.atacanteTime === 'casa' ? home_club_id : away_club_id,
          atacante_id: atacante.id,
          defensor_id: defensor.id,
          nome_atacante: atacante.nome,
          nome_defensor: defensor.nome,
          posicao_atacante: atacante.posicao,
          posicao_defensor: defensor.posicao,
          condicao_atacante: atacante.condicao,
          condicao_defensor: defensor.condicao,
          atributo_ataque: d.atAttr,
          atributo_defesa: d.defAttr,
          valor_ataque: valAtaque,
          valor_defesa: valDefesa,
          gol: ehGol
        });
      }

      golsMandante = Math.min(3, golsMandante);
      golsVisitante = Math.min(3, golsVisitante);

      let result = 'EMPATE';
      if (golsMandante > golsVisitante) result = 'MANDANTE';
      else if (golsVisitante > golsMandante) result = 'VISITANTE';

      const partidaId = await db.transaction(async (trx) => {
        const [pid] = await trx('partidas').insert({
          mandante_id: home_club_id,
          visitante_id: away_club_id,
          gols_mandante: golsMandante,
          gols_visitante: golsVisitante,
          formacao_mandante: mandante.formacao,
          formacao_visitante: visitante.formacao
        });

        const insertsDuelos = duelosResultado.map(dr => ({ ...dr, partida_id: pid }));
        await trx('duelos_partida').insert(insertsDuelos);
        return pid;
      });

      res.setHeader('Location', `/api/v1/matches/${partidaId}`);
      return res.status(201).json({
        id: partidaId,
        played_at: new Date().toISOString(),
        home: { club_id: home_club_id, club_name: mandante.nome, formation: mandante.formacao, goals: golsMandante },
        away: { club_id: away_club_id, club_name: visitante.nome, formation: visitante.formacao, goals: golsVisitante },
        result,
        duels: duelosResultado.map(dr => ({
          order: dr.ordem,
          attacking_club_id: dr.clube_atacante_id,
          attacker: { player_id: dr.atacante_id, player_name: dr.nome_atacante, position: dr.posicao_atacante, condition: dr.condicao_atacante, attribute: dr.atributo_ataque, value: dr.valor_ataque },
          defender: { player_id: dr.defensor_id, player_name: dr.nome_defensor, position: dr.posicao_defensor, condition: dr.condicao_defensor, attribute: dr.atributo_defesa, value: dr.valor_defesa },
          goal: dr.gol
        }))
      });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  async listarPartidas(req: Request, res: Response) {
    try {
      const { club_id } = req.query;
      let query = db('partidas');
      if (club_id) {
        query = query.where('mandante_id', club_id).orWhere('visitante_id', club_id);
      }
      const partidas = await query.orderBy('jogada_em', 'desc').orderBy('id', 'desc');
      const clubes = await db('clubes');
      const mapaClubes = new Map(clubes.map(c => [c.id, c.nome]));

      const resultado = partidas.map(p => {
        let result = 'EMPATE';
        if (p.gols_mandante > p.gols_visitante) result = 'MANDANTE';
        else if (p.gols_visitante > p.gols_mandante) result = 'VISITANTE';

        return {
          id: p.id,
          played_at: p.jogada_em,
          home: { club_id: p.mandante_id, club_name: mapaClubes.get(p.mandante_id), formation: p.formacao_mandante, goals: p.gols_mandante },
          away: { club_id: p.visitante_id, club_name: mapaClubes.get(p.visitante_id), formation: p.formacao_visitante, goals: p.gols_visitante },
          result
        };
      });

      return res.json(resultado);
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  async classificacao(req: Request, res: Response) {
    try {
      const clubes = await db('clubes');
      const estatisticas: Record<number, any> = {};

      clubes.forEach(c => {
        estatisticas[c.id] = {
          club_id: c.id,
          club_name: c.nome,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals_for: 0,
          goals_against: 0,
          goal_difference: 0,
          points: 0
        };
      });

      const partidas = await db('partidas');
      partidas.forEach(p => {
        const h = estatisticas[p.mandante_id];
        const a = estatisticas[p.visitante_id];
        if (!h || !a) return;

        h.played++;
        a.played++;
        h.goals_for += p.gols_mandante;
        h.goals_against += p.gols_visitante;
        a.goals_for += p.gols_visitante;
        a.goals_against += p.gols_mandante;

        if (p.gols_mandante > p.gols_visitante) {
          h.wins++;
          h.points += 3;
          a.losses++;
        } else if (p.gols_visitante > p.gols_mandante) {
          a.wins++;
          a.points += 3;
          h.losses++;
        } else {
          h.draws++;
          h.points += 1;
          a.draws++;
          a.points += 1;
        }
      });

      const tabela = Object.values(estatisticas).map(e => ({
        ...e,
        goal_difference: e.goals_for - e.goals_against
      }));

      tabela.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
        if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
        return a.club_name.localeCompare(b.club_name);
      });

      const comPosicao = tabela.map((t, idx) => ({
        position: idx + 1,
        ...t
      }));

      return res.json(comPosicao);
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  }
};