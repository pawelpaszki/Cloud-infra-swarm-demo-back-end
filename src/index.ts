import app from './config/app';

const port = process.env.PORT || 3000;

app.listen(port, (err) => {
  if (err) {
    /* tslint:disable */ return console.log(err); /* tslint:enable */
  }
  /* tslint:disable */ return console.log(`server is listening on ${port}`); /* tslint:enable */
});
