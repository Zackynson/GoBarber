import { Router } from 'express';
import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();

routes.post('/users', UserController.store);
routes.post('/sessions', SessionController.store);

// rotas abaixo usarao o middleware
routes.use(authMiddleware);
routes.put('/users', UserController.update);

export default routes;
