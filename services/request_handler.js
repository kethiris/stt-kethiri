const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const mv = require('mv');

var transcriber = require("./transcriber");
var dbhandler = require("../controller/db_controller");

const resourcepath = path.join(__dirname, '..', 'resources');

/**
 * Validates and process the uploaded file
 * @param  {formidable.Files} files  Uploaded file object
 * @param  {Express.Request} req HTTP request object 
 * @param  {Express.Response} res HTTP response object 
 * @param  {Express.next} next Error handling middleware from Express module.
 * @param  {Function} next Callback function to deliver the HTTP response.
 * @return NONE
 */
function processFile(files, req, res, next, end) {
    var jsonResponse = {
        inputfile: null,
        error: null,
        result: null
    };
    try {
        jsonResponse.inputfile = files.filetoupload;
        if (files.filetoupload.type != "video/mp4" && files.filetoupload.type != "audio/x-m4a" && files.filetoupload.type != "audio/mp4") {
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
            var userID = req.session.user_id;
            transcriber.convertToWAV(newPath, convertedFilePath, jsonResponse, res, userID, onConversionSuccess, end);
            return;
        }
        if (jsonResponse.inputfile) delete jsonResponse.inputfile.path;
        end(res, jsonResponse);
    }
    catch (err) {
        console.error(`An error occured while processing the file ${files.filetoupload.path}` + err);
        if (jsonResponse.inputfile) delete jsonResponse.inputfile.path;
        jsonResponse.error = "Internal System Error";
        end(res, jsonResponse);
    }
}

module.exports.processFile = processFile;

/**
 * Callback function which will be fired once the file is successfully converted to wav
 * @param  {String} srcFile  original file path
 * @param  {String} convertedFile converted file path
 * @param  {JSON} jsonResponse Response to be sent back to the browser
 * @param  {Express.Response} res HTTP response object 
 * @param  {INT} userID user_id of who initiated the request
 * @param  {Function} end Callback function to deliver the HTTP response
 * @return NONE
 */
function onConversionSuccess(srcFile, convertedFile, jsonResponse, res, userID, end) {
    try {
        const query = {
            text: 'INSERT INTO jobs(user_id, file_name, file_path,status) VALUES($1, $2, $3, $4) RETURNING job_id;',
            values: [userID, path.parse(srcFile).name, srcFile, 'Not Started']
        }
        dbhandler.executeQuery(query)
            .then(result => {
                console.log(result);
                var jobID = result.rows[0].job_id;
                transcriber.transcribe(convertedFile, jsonResponse, res, jobID, onTranscriptionComplete, end);
            })
            .catch(err => {
                console.error("An error occured during executing a DB query :\n", err);
                jsonResponse.error = "Internal System Error";
                end(res, jsonResponse);
            })
    }
    catch (err) {
        console.error("An error occured during transcription", err);
    }
}

/**
 * Callback function which will be fired once the file is successfully transcripted
 * @param  {Express.Response} res  Associated job_id of the transcription request
 * @param  {JSON} jsonResponse  response to be sent back to the browser
 * @param  {INT} jobID  Associated job_id of the transcription request
 * @param  {Function} end Callback function to deliver the HTTP response
 * @return NONE
 */
function onTranscriptionComplete(res, jsonResponse, jobID, end) {
    console.log(`Transcription complete for jobID ${jobID}`);
    end(res, jsonResponse);
    try {
        const query = {
            text: 'UPDATE jobs SET status = $1,  transcript = $2 WHERE job_id = $3',
            values: [(res.status == 200) ? 'Success' : 'Failed', jsonResponse, jobID]
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