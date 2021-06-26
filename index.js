const express = require('express');
const router = express.Router();
const app = express()

const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const mv = require('mv');

var transcriber = require("./transcriber");

// create resouce folder to save the m4a files in the server
const resourcepath = path.join(__dirname, 'resources');
fs.mkdirSync(resourcepath, { recursive: true });

// render the file upload form
router.get('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
  res.write('<input type="file" name="filetoupload"><br>');
  res.write('<input type="submit">');
  res.write('</form>');
  return res.end();
});

// parse the upload form
router.post('/fileupload', (req, res, next) => {
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    if (err) next(err);
    processFile(files, res, next);
  });
});

// redirect to root route in case if invalid route
router.get('/*', (req, res) => {
  res.redirect('/');
})

app.use('/', router);
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server started on ${process.env.PORT}`);
})

/**
 * Validates and process the uploaded file
 * @param  {formidable.Files} files  Uploaded file object
 * @param  {Express.Response} res HTTP response object 
 * @param  {Express.next} next Error handling middleware from Express module.
 * @return NONE
 */
function processFile(files, res, next) {
  res.header("Content-Type", 'application/json');
  var jsonResponse = {
    inputfile: null,
    error: null,
    result: null
  };

  jsonResponse.inputfile = files.filetoupload;
  if (files.filetoupload.type != "video/mp4" && files.filetoupload.type != "audio/x-m4a") {
    jsonResponse.error = "Invalid file format. Supported formats : .mp4, .m4a"
    res.status(415); // unsupported media type
  }
  else if (files.filetoupload.size < 100) {
    jsonResponse.error = "File too small. Min size supported : 100 bytes"
    res.status(204); // no content
  }
  else if (files.filetoupload.size > 104857600) {
    jsonResponse.error = "File too large. Max size supported : 100 MB"
    res.status(413); // payload too large
  }
  else {
    var oldPath = files.filetoupload.path;
    var newPath = path.join(resourcepath, files.filetoupload.name);
    console.log(`A new file is uploaded and saved in ${newPath}`);
    mv(oldPath, newPath, (err) => {
      if (err) next(err);
    });
    res.status(202) // accepted
    var convertedFilePath = path.join(resourcepath,path.parse(newPath).name+".wav");
    transcriber.convertToWAV(newPath, convertedFilePath, jsonResponse,res, (convertedFilePath,jsonResponse,res) =>
    {
      transcriber.transcribe(convertedFilePath,jsonResponse,res);
    });
    return;
  }

  if (jsonResponse.inputfile) delete jsonResponse.inputfile.path;
  res.send(JSON.stringify(jsonResponse, null, 4));
}