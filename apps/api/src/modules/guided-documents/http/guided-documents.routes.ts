import { Hono } from 'hono';
import { requireAuth } from '../../../shared/infrastructure/middlewares/auth.js';
import {
  getAnswersHandler,
  saveAnswersHandler,
  importProposalHandler,
  generateDocxHandler,
} from './guided-documents.controller.js';

export const guidedDocumentsRouter = new Hono();

guidedDocumentsRouter.get('/cases/:id/guided-documents/answers', requireAuth, getAnswersHandler);
guidedDocumentsRouter.put('/cases/:id/guided-documents/answers', requireAuth, saveAnswersHandler);
guidedDocumentsRouter.post('/cases/:id/guided-documents/import', requireAuth, importProposalHandler);
guidedDocumentsRouter.post('/cases/:id/guided-documents/generate', requireAuth, generateDocxHandler);
