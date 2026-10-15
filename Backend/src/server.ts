import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();

const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({ origin: frontendOrigin }));


app.use((req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ message: 'O corpo da requisição deve ser um objeto JSON válido.' });
    }
  }
  next();
});

app.use(express.json());


app.get('/api/v1/health', (req: Request, res: Response) => {
  return res.json({ status: 'API Desafio ISI Dev operacional' });
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
});