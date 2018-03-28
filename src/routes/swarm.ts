import * as express from 'express';
import SwarmController from '../controllers/swarmController';

const swarm = express.Router();

swarm.get('/instances', SwarmController.list);
swarm.post('/idSwarm', SwarmController.identifySwarm);
swarm.post('/deleteSwarm', SwarmController.deleteSwarm);
swarm.post('/leaveSwarm', SwarmController.leaveSwarm);
swarm.post('/create', SwarmController.createSwarm);
swarm.post('/joinSwarm', SwarmController.joinSwarm);
swarm.post('/getServices', SwarmController.getServices);
swarm.post('/scaleService', SwarmController.scaleService);
swarm.post('/removeServices', SwarmController.removeServices);
swarm.post('/drain', SwarmController.drainNode);
swarm.post('/makeAvailable', SwarmController.makeAvailable);
swarm.post('/removeFromSwarm', SwarmController.removeFromSwarm);

export default swarm;
