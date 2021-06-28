const fs = require('fs');
const path = require('path')
const express = require('express');
const session = require('express-session');
const router = express.Router();

// create resouce folder to save the m4a files in the server
const resourcepath = path.join(__dirname, 'resources');
fs.mkdirSync(resourcepath, { recursive: true });

const app = express()
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 

app.use(express.urlencoded({extended: true})); 
app.use(express.json());
app.use(session({ 
  session_id: function(req) {return genuuid()},
  secret:'XASDASDA',
  saveUninitialized: true,
  resave: false
}))
app.use('/', router);
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server started on ${process.env.PORT}`);
})

require('./routes/api_routes')(router);
