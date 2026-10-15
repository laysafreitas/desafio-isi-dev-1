export function roundCurrency(val: number): number {
  return Number((Math.round((val + Number.EPSILON) * 100) / 100).toFixed(2));
}

export function roundHalfUp(val: number): number {
  return Math.floor(val + 0.5);
}

export function sanitizeText(text: string): string {
  if (typeof text !== 'string') return '';
  if (/[\t\n\r]/.test(text)) throw new Error('Caracteres de controle não são permitidos.');
  return text.trim().replace(/\s+/g, ' ');
}

export function normalizeString(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const positionOrder: Record<string, number> = { GOL: 1, ZAG: 2, LAT: 3, MEI: 4, ATA: 5 };
export function getPositionWeightOrder(pos: string): number {
  return positionOrder[pos] || 99;
}

export function calcularOverall(posicao: string, attrs: { velocidade: number, finalizacao: number, passe: number, drible: number, defesa: number, fisico: number }): number {
  const pesos: Record<string, Record<string, number>> = {
    GOL: { velocidade: 10, finalizacao: 0, passe: 0, drible: 0, defesa: 80, fisico: 10 },
    ZAG: { velocidade: 10, finalizacao: 0, passe: 15, drible: 0, defesa: 60, fisico: 15 },
    LAT: { velocidade: 25, finalizacao: 0, passe: 20, drible: 15, defesa: 25, fisico: 15 },
    MEI: { velocidade: 10, finalizacao: 15, passe: 35, drible: 25, defesa: 5, fisico: 10 },
    ATA: { velocidade: 20, finalizacao: 40, passe: 10, drible: 20, defesa: 0, fisico: 10 },
  };

  const p = pesos[posicao] || pesos['ATA'];
  const soma = (attrs.velocidade * p.velocidade) +
               (attrs.finalizacao * p.finalizacao) +
               (attrs.passe * p.passe) +
               (attrs.drible * p.drible) +
               (attrs.defesa * p.defesa) +
               (attrs.fisico * p.fisico);
  
  return roundHalfUp(soma / 100);
}

export function calcularValorBase(overall: number, potencial: number, idade: number): number {
  let parteOverall = 0;
  if (overall > 40 && overall <= 60) {
    parteOverall = (overall - 40) * 0.50;
  } else if (overall > 60 && overall <= 75) {
    parteOverall = (20 * 0.50) + ((overall - 60) * 2.00);
  } else if (overall > 75 && overall <= 99) {
    parteOverall = (20 * 0.50) + (15 * 2.00) + ((overall - 75) * 6.00);
  }

  if (idade <= 21) {
    parteOverall = parteOverall * ((100 + potencial - overall) / 100);
  }

  let base = roundCurrency(parteOverall);
  return base < 1.00 ? 1.00 : base;
}

export function calcularValorMercado(baseValue: number, condicao: string, agilidade: number, idade: number): number {
  let descontoCondicao = 0;
  if (condicao === 'MAL_CONDICIONADO') descontoCondicao = 15;
  if (condicao === 'DOENTE') descontoCondicao = 30;

  if (condicao !== 'APTO') {
    if (agilidade >= 80 && agilidade <= 100) {
      descontoCondicao = descontoCondicao / 2;
    } else if (agilidade >= 1 && agilidade <= 30) {
      descontoCondicao = descontoCondicao + 10;
    }
  }

  let ajusteIdade = 0;
  if (idade <= 21) ajusteIdade = 10;
  else if (idade >= 32) ajusteIdade = -10;

  let percentualTotal = ajusteIdade - descontoCondicao;
  if (percentualTotal < -40) percentualTotal = -40;

  let marketValue = roundCurrency(baseValue * (100 + percentualTotal) / 100);
  return marketValue < 1.00 ? 1.00 : marketValue;
}