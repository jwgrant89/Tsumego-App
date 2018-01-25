const express = require('express')
const app = express()
const port = 3001
const fs = require('fs')
const bodyParser = require('body-parser')

app.use(bodyParser.json());
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.sendStatus(200);
    }
    else {
      next();
    }
};
app.use(allowCrossDomain);

app.use(express.static('problems'));
app.get('/',(request,response) =>{
  console.log(request);
  res.send("home");
})
// app.get('/problems/:name', (request, response) => {
//   console.log("here");
//   let file = "./problems/" + request.params.name;
//   let content="";
//   fs.readFile(file,"utf8",function read(err,data){
//     content=data;
//   })
//   console.log(file + "loaded");
//   response.send(content);
// })


app.post('/', (request,response) => {
  let file=request.body.filename;
  let data = request.body.string;
  fs.writeFile(file,data,function(err){if(err!== null){console.log(err)}});
  console.log(file + " saved");
  response.send("saved");
})

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})
