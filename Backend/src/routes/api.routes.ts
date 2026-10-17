import { Router } from 'express';
import { playerController } from '../controllers/playerController';
import { clubController } from '../controllers/clubController';
import { marketController } from '../controllers/marketController';
import { matchController } from '../controllers/matchController';
import { db } from '../Config/database';

const router = Router();

router.get('/players', playerController.listar);
router.post('/players', playerController.cadastrar);
router.get('/players/:id', playerController.consultar);
router.put('/players/:id', playerController.editar);
router.patch('/players/:id/condition', playerController.alterarCondicao);
router.delete('/players/:id', playerController.excluir);

router.post('/players/:id/buy', marketController.comprar);
router.post('/players/:id/sell', marketController.vender);


router.get('/clubs', clubController.listar);
router.post('/clubs', clubController.criar);
router.get('/clubs/:id', clubController.consultar);

router.get('/clubs/:id/transactions', marketController.historicoTransacoes);

router.put('/clubs/:id/lineup', matchController.escalar);
router.get('/clubs/:id/lineup', async (req, res) => {

  const { id } = req.params;
  const clube = await db('clubes').where({ id }).first();
  if (!clube) return res.status(404).json({ message: 'Clube não encontrado.' });
  const escalados = await db('escalacoes').where({ clube_id: id }).select('jogador_id');
  const ids = escalados.map(e => e.jogador_id);
  const players = await db('jogadores').whereIn('id', ids).whereNull('excluido_em');
  return res.json({
    club_id: Number(id),
    formation: clube.formacao,
    complete: players.length === 5,
    players
  });
});

router.post('/matches', matchController.jogarPartida);
router.get('/matches', matchController.listarPartidas);
router.get('/matches/:id', async (req, res) => {
  const { id } = req.params;
  const partida = await db('partidas').where({ id }).first();
  if (!partida) return res.status(404).json({ message: 'Partida não encontrada.' });
  const duelos = await db('duelos_partida').where({ partida_id: id }).orderBy('ordem', 'asc');
  const mandante = await db('clubes').where({ id: partida.mandante_id }).first();
  const visitante = await db('clubes').where({ id: partida.visitante_id }).first();

  let result = 'EMPATE';
  if (partida.gols_mandante > partida.gols_visitante) result = 'MANDANTE';
  else if (partida.gols_visitante > partida.gols_mandante) result = 'VISITANTE';

  return res.json({
    id: partida.id,
    played_at: partida.jogada_em,
    home: { club_id: partida.mandante_id, club_name: mandante.nome, formation: partida.formacao_mandante, goals: partida.gols_mandante },
    away: { club_id: partida.visitante_id, club_name: visitante.nome, formation: partida.formacao_visitante, goals: partida.gols_visitante },
    result,
    duels: duelos.map(dr => ({
      order: dr.ordem,
      attacking_club_id: dr.clube_atacante_id,
      attacker: { player_id: dr.atacante_id, player_name: dr.nome_atacante, position: dr.posicao_atacante, condition: dr.condicao_atacante, attribute: dr.atributo_ataque, value: dr.valor_ataque },
      defender: { player_id: dr.defensor_id, player_name: dr.nome_defensor, position: dr.posicao_defensor, condition: dr.condicao_defensor, attribute: dr.atributo_defesa, value: dr.valor_defesa },
      goal: dr.gol
    }))
  });
});

router.get('/standings', matchController.classificacao);

export default router;