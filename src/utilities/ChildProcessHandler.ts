import * as child from 'child_process';

export class ChildProcessHandler {

  public static executeChildProcCommand(command: string, errorsPossible: boolean): Promise<any> {
    const p: Promise<any> = new Promise((resolve, reject) => {
      setTimeout(() => {
        child.exec(command, (error, stdout, stderr) => {
          if (error) {
            if (errorsPossible === true) {
              if (error === null) {
                resolve(error);
              } else {
                resolve('');
              }
            } else {
              reject(error);
            }
          } else if (stdout) {
            resolve(stdout);
          } else if (stderr) {
              resolve(stderr);
          } else {
            resolve('');
          }
        });
      }, 200);
    });
    return p;
  }
}
