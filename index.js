const express = require('express');
const router = express.Router();
const app = express()

const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const mv = require('mv');

// create resouce folder to save the m4a files in the server
const resourcepath = path.join(__dirname, 'resources');
fs.mkdirSync(resourcepath, { recursive: true });

// render the file upload form
router.get('/',(req,res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
    res.write('<input type="file" name="filetoupload"><br>');
    res.write('<input type="submit">');
    res.write('</form>');
    return res.end();
});

// process the fileupload form action
router.post('/fileupload',(req,res) => {
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    var oldpath = files.filetoupload.path;
    var newpath = path.join(resourcepath, files.filetoupload.name);
    console.log(`A new file is uploaded and saved in ${newpath}`);
    mv(oldpath, newpath, function (err) {
      if (err) next(err);
      res.write('Your file is uploaded and being processed!');
      res.end();
    });
  });
});

// redirect to root route in case if invalid route
router.get('/*',(req,res) => {
  res.redirect('/');
})

app.use('/', router);
app.listen(process.env.PORT || 8080 ,() => {
  console.log(`Server started on ${process.env.PORT}`);
})
