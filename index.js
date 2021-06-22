var http = require('http');

http.createServer(function (req, res) {
  res.write('Speech To Text Service');
  res.end();
}).listen(process.env.PORT || 8080);