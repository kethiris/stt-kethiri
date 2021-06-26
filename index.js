const express = require('express');
const router = express.Router();
const app = express()

const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const mv = require('mv');

var transcriber = require("./transcriber");
var dbhandler = require("./dbhandler")

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

  var jsonResponse = {
    inputfile: null,
    error: null,
    result: null
  };
  try {
    res.header("Content-Type", 'application/json');
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
      mv(oldPath, newPath, (err) => { console.error(err) });
      res.status(202) // accepted
      var convertedFilePath = path.join(resourcepath, path.parse(newPath).name + ".wav");
      var userID = 37;
      transcriber.convertToWAV(newPath, convertedFilePath, jsonResponse, res, userID, onConversionSuccess);
      return;
    }
    if (jsonResponse.inputfile) delete jsonResponse.inputfile.path;
    res.send(JSON.stringify(jsonResponse, null, 4));
  }
  catch (err) {
    console.error(`An error occured while processing the file ${files.filetoupload.path}` + err);
    if (jsonResponse.inputfile) delete jsonResponse.inputfile.path;
    jsonResponse.error = "Internal System Error";
    res.send(JSON.stringify(jsonResponse, null, 4));
  }
}

/**
 * Callback function which will be fired once the file is successfully converted to wav
 * @param  {String} srcFile  original file path
 * @param  {String} convertedFile converted file path
 * @param  {JSON} jsonResponse Response to be sent back to the browser
 * @param  {Express.Response} res HTTP response object 
 * @param  {INT} userID user_id of who initiated the request
 * @return NONE
 */
function onConversionSuccess(srcFile, convertedFile, jsonResponse, res, userID) {
  try {
    const query = {
      text: 'INSERT INTO jobs(user_id, file_name, file_path,status) VALUES($1, $2, $3, $4) RETURNING job_id;',
      values: [userID, path.parse(srcFile).name , srcFile, 'Not Started']
    }
    dbhandler.executeQuery(query)
      .then(result => {
        console.log(result);
        var jobID = result.rows[0].job_id;
        transcriber.transcribe(convertedFile, jsonResponse, res, jobID, onTranscriptionComplete);
        console.log("Transcription complete");
      })
      .catch(err => {
        console.error("An error occured during executing a DB query :\n", err);
        jsonResponse.error = "Internal System Error";
        res.send(JSON.stringify(jsonResponse, null, 4));
      })
  }
  catch (err) {
    console.error("An error occured during transcription", err);
  }
}

/**
 * Callback function which will be fired once the file is successfully transcripted
 * @param  {INT} jobID  Associated job_id of the transcription request
 * @param  {JSON} jsonResult Transcription result from the STT service
 * @return NONE
 */
function onTranscriptionComplete(jobID, jsonResult) {
  try {
    const query = {
      text: 'UPDATE jobs SET status = $1,  transcript = $2 WHERE job_id = $3',
      values: ['Success', jsonResult , jobID]
    }
    dbhandler.executeQuery(query)
      .then(result => {
        console.log(result);
        console.log(`Job ${jobID} complete`);
      })
      .catch(err => {
        console.error("An error occured during executing a DB query :\n", err);
      })
  }
  catch (err) {
    console.error("An error occured during transcription", err);
  }
}