import { Request, Response } from 'express';
import * as AWS from 'aws-sdk';
AWS.config.update({region: 'us-west-2'});
const Client = require('ssh2').Client;


interface IInstance {
  publicDns: any;
  privateIp: any;
  publicIp: any;
  launchTime: any;
  instanceId: any;
}
class SwarmController {

  public identifySwarm = async (req: Request, res: Response) => {
    const conn = new Client();
    conn.on('ready', function() {
      console.log('Client :: ready');
      conn.exec('docker node ls', function(err, stream) {
        if (err) throw err;
        stream.on('close', function(code, signal) {
          console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
          conn.end();
        }).on('data', function(data) {
          const result = data.toString();
          let tokens = result.split(' ').join(',').split('\n').join(',').split('ip-').join(',').split(',');
          tokens = tokens.filter((line) => line !== '' && line !== '*');
          tokens = tokens.splice(6,tokens.length -1);
          const ipChangedTokens: string[] = [];
          for (let token of tokens) {
            ipChangedTokens.push(token.replace(/-/g, "."));
          }
          conn.end();
          return res.status(200).json({
            response: ipChangedTokens,
          });
        }).stderr.on('data', function(data) {
          conn.end();
          return res.status(200).json({
            response: 'not a manager',
          });
        });
      });
    }).connect({
      host: req.body.publicDns,
      port: 22,
      username: 'ec2-user',
      privateKey: require('fs').readFileSync('./cloud-infra.pem')
    });
  }

  public createSwarm = async (req: Request, res: Response) => {
    const conn = new Client();
    let dataSent: boolean = false;
    conn.on('ready', function() {
      console.log('Client :: ready');
      conn.exec('docker swarm init', function(err, stream) {
        if (err) throw err;
        stream.on('close', function(code, signal) {
          console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
          conn.end();
        }).on('data', function(data) {
          let result = data.toString();
          console.log(result);
          if(result.includes('docker swarm join')) {
            result = result.substring(result.indexOf('docker swarm join'));
            if(!dataSent) {
              res.status(200).json({
                command: result
              });
              dataSent = true;
            }
          }
        })
      });
    }).connect({
      host: req.body.publicDns,
      port: 22,
      username: 'ec2-user',
      privateKey: require('fs').readFileSync('./cloud-infra.pem')
    });
  }

  public deleteSwarm = async (req: Request, res: Response) => {
    const conn = new Client();
    conn.on('ready', function() {
      console.log('Client :: ready');
      conn.exec('docker swarm leave --force', function(err, stream) {
        if (err) throw err;
        stream.on('close', function(code, signal) {
          console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
          conn.end();
        }).on('data', function() {
          return res.status(200).json({
            message: 'ok',
          });
        }).stderr.on('data', function() {
          return res.status(200).json({
            message: 'unable to leave a swarm',
          });
        });
      });
    }).connect({
      host: req.body.publicDns,
      port: 22,
      username: 'ec2-user',
      privateKey: require('fs').readFileSync('./cloud-infra.pem')
    });
  }

  public leaveSwarm = async (req: Request, res: Response) => {
    const conn = new Client();
    conn.on('ready', function() {
      console.log('Client :: ready');
      conn.exec('docker swarm leave', function(err, stream) {
        if (err) throw err;
        stream.on('close', function(code, signal) {
          console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
          conn.end();
        }).on('data', function(data) {
          return res.status(200).json({
            message: 'OK',
          });
        }).stderr.on('data', function(data) {
          return res.status(200).json({
            message: 'unable to leave swarm',
          });
        });
      });
    }).connect({
      host: req.body.publicDns,
      port: 22,
      username: 'ec2-user',
      privateKey: require('fs').readFileSync('./cloud-infra.pem')
    });
  }

  public removeFromSwarm = async (req: Request, res: Response) => {
    const conn = new Client();
    conn.on('ready', function() {
      console.log('Client :: ready');
      conn.exec('docker node rm ' + req.body.ipAddress, function(err, stream) {
        if (err) throw err;
        stream.on('close', function(code, signal) {
          console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
          conn.end();
        }).on('data', function() {
          return res.status(200).json({
            message: 'OK',
          });
        }).stderr.on('data', function() {
          return res.status(200).json({
            message: 'unable to remove from swarm',
          });
        });
      });
    }).connect({
      host: req.body.publicDns,
      port: 22,
      username: 'ec2-user',
      privateKey: require('fs').readFileSync('./cloud-infra.pem')
    });
  }

  public getServices = async (req: Request, res: Response) => {
    const conn = new Client();
    let resSend: boolean = false;
    let resultString: string = '';
    conn.on('ready', function() {
      console.log('Client :: ready');
      conn.exec('docker service ps alpine-test', function(err, stream) {
        if (err) throw err;
        stream.on('close', function(code, signal) {
          console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
          let tokens = resultString.split(' ').join(',').split('\n').join(',').split('ip-').join(',').split(',');
          tokens = tokens.filter((line) => line !== '' && line !== '*');
          tokens = tokens.splice(10,tokens.length -1);
          const ipChangedTokens: string[] = [];
          for (let token of tokens) {
            if(token.includes('alpine-test')) {
              ipChangedTokens.push(token);
            } else {
              ipChangedTokens.push(token.replace(/-/g, "."));
            }
          }
          let serviceData: string[] = [];
          for (let i = 0; i < ipChangedTokens.length; i++) {
            if (ipChangedTokens[i].includes('alpine-test') && i + 3 < ipChangedTokens.length && ipChangedTokens[i + 3].includes('Running')) {
              serviceData.push(ipChangedTokens[i]);
              serviceData.push(ipChangedTokens[i + 2]);
            }
          }
          conn.end();
          if(!resSend) {
            resSend = true;
            return res.status(200).json({
              response: serviceData,
            });
          }
        }).on('data', function(data) {
          resultString += data.toString();
        }).stderr.on('data', function() {
          conn.end();
          if(!resSend) {
            resSend = true;
            return res.status(200).json({
              response: [],
            });
          }
        });
      });
    }).connect({
      host: req.body.publicDns,
      port: 22,
      username: 'ec2-user',
      privateKey: require('fs').readFileSync('./cloud-infra.pem')
    });
  }

  public scaleService = async (req: Request, res: Response) => {
    const conn = new Client();
    conn.on('ready', function() {
      console.log('Client :: ready');
      conn.exec('docker service create --replicas 5 --name alpine-test alpine ping docker.com', function(err, stream) {
        if (err) throw err;
        stream.on('close', function(code, signal) {
          console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
          conn.end();
        }).on('data', function() {
          conn.end();
          return res.status(200).json({
            message: 'scaled',
          });
        }).stderr.on('data', function() {
          conn.end();
          return res.status(500).json({
            message: 'unable to scale the service',
          });
        });
      });
    }).connect({
      host: req.body.publicDns,
      port: 22,
      username: 'ec2-user',
      privateKey: require('fs').readFileSync('./cloud-infra.pem')
    });
  }

  public removeServices = async (req: Request, res: Response) => {
    const conn = new Client();
    conn.on('ready', function() {
      console.log('Client :: ready');
      conn.exec('docker service rm alpine-test', function(err, stream) {
        if (err) throw err;
        stream.on('close', function(code, signal) {
          console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
          conn.end();
        }).on('data', function() {
          conn.end();
          return res.status(200).json({
            message: 'removed',
          });
        }).stderr.on('data', function() {
          conn.end();
          return res.status(500).json({
            message: 'unable to remove the service',
          });
        });
      });
    }).connect({
      host: req.body.publicDns,
      port: 22,
      username: 'ec2-user',
      privateKey: require('fs').readFileSync('./cloud-infra.pem')
    });
  }

  public joinSwarm = async (req: Request, res: Response) => {
    const conn = new Client();
    const command: string = req.body.joinCommand;
    if(command.includes('join') && command.includes('2377')) {
      conn.on('ready', function() {
        console.log('Client :: ready');
        conn.exec(command, function(err, stream) {
          if (err) throw err;
          stream.on('close', function(code, signal) {
            console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
            conn.end();
          }).on('data', function() {
            return res.status(200).json({
              message: 'OK',
            });
          }).stderr.on('data', function() {
            return res.status(500).json({
              error: 'unable to join the swarm',
            });
          });
        });
      }).connect({
        host: req.body.publicDns,
        port: 22,
        username: 'ec2-user',
        privateKey: require('fs').readFileSync('./cloud-infra.pem')
      });
    } else {
      return res.status(500).json({
        error: 'invalid command',
      });
    }
  }

  public drainNode = async (req: Request, res: Response) => {
    const conn = new Client();
    let resSend: boolean = false;
    if(req.body.ipAddress && req.body.ipAddress.toString().includes('ip-')) {
      conn.on('ready', function() {
        console.log('Client :: ready');
        conn.exec('docker node update --availability drain ' + req.body.ipAddress, function(err, stream) {
          if (err) throw err;
          stream.on('close', function(code, signal) {
            console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
            conn.end();
            if(!resSend) {
              resSend = true;
              return res.status(200).json({
                response: 'OK',
              });
            }
          }).on('data', function() {
            if(!resSend) {
              resSend = true;
              return res.status(200).json({
                response: 'OK',
              });
            }
          }).stderr.on('data', function() {
            conn.end();
            if(!resSend) {
              resSend = true;
              return res.status(500).json({
                error: 'unable to drain',
              });
            }
          });
        });
      }).connect({
        host: req.body.publicDns,
        port: 22,
        username: 'ec2-user',
        privateKey: require('fs').readFileSync('./cloud-infra.pem')
      });
    } else {
      return res.status(500).json({
        error: 'invalid command',
      });
    }
  }

  public makeAvailable = async (req: Request, res: Response) => {
    const conn = new Client();
    let resSend: boolean = false;
    if(req.body.ipAddress && req.body.ipAddress.toString().includes('ip-')) {
      conn.on('ready', function() {
        console.log('Client :: ready');
        conn.exec('docker node update --availability active ' + req.body.ipAddress, function(err, stream) {
          if (err) throw err;
          stream.on('close', function(code, signal) {
            console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
            conn.end();
            if(!resSend) {
              resSend = true;
              return res.status(200).json({
                response: 'OK',
              });
            }
          }).on('data', function() {
            if(!resSend) {
              resSend = true;
              return res.status(200).json({
                response: 'OK',
              });
            }
          }).stderr.on('data', function() {
            conn.end();
            if(!resSend) {
              resSend = true;
              return res.status(500).json({
                error: 'unable to make available',
              });
            }
          });
        });
      }).connect({
        host: req.body.publicDns,
        port: 22,
        username: 'ec2-user',
        privateKey: require('fs').readFileSync('./cloud-infra.pem')
      });
    } else {
      return res.status(500).json({
        error: 'invalid command',
      });
    }
  }

  public list = async (req: Request, res: Response) => {
    const ec2 = new AWS.EC2({apiVersion: '2016-11-15'});
    const params = {
      DryRun: false
    };
    ec2.describeInstances(params, function(err, data) {
      if (err) {
        return res.status(500).json({
          err,
        });
      } else {
        const instances: IInstance[] = [];
        for (let reservation of data.Reservations) {
          for (let instance of reservation.Instances) {
            if(instance.State.Name !== 'stopped') {
              for (let tag of instance.Tags) {
                if (tag.Key === 'Name' && tag.Value === 'docker-swarm') {
                  instances.push({
                    publicDns: instance.PublicDnsName,
                    privateIp: instance.PrivateIpAddress,
                    publicIp: instance.PublicIpAddress,
                    launchTime: instance.LaunchTime,
                    instanceId: instance.InstanceId
                  })
                }
              }
            }
          }
        }
        return res.status(200).json({
          instances,
        });
      }
    });
  }

}

export default new SwarmController();
