import * as bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import * as express from 'express';
import * as cors from 'cors';
dotenv.config();
import swarm from '../routes/swarm';
class App {
  public express;

  constructor() {
    this.express = express();
    this.middleware();
    this.mountRoutes();
  }


  // Configure Express middleware.
  private middleware(): void {
    this.express.use(bodyParser.json());
    this.express.use(bodyParser.urlencoded({extended: false}));
  }

  private mountRoutes(): void {
    this.express.use(cors());
    this.express.use('/api', swarm);
    this.express.use('/', (req, res) => {
      res.status(404).send({error: `path doesn't exist`});
    });
  }
}

export default new App().express;
