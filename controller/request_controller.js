const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const mv = require('mv');

var transcriber = require("../services/transcriber");
var dbhandler = require("./db_controller");

const resourcepath = path.join(__dirname, '..', 'resources');

module.exports.processFileUpload = function(req,res,next,end){
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err) next(err);
        else processFile(files, req, res, next, end);
    });
}

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
    jsonResponse.inputfile = files.filetoupload.name;
    var supportedFileTypes = ["video/mp4","audio/x-m4a","audio/mp4","audio/mpeg","video/mpeg"]

    try {
        if (supportedFileTypes.includes(files.filetoupload.type) == false) {
            jsonResponse.error = "Unsupported file format. Supported formats : .mp4 | .m4a | .mp3"
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
                if (err)
                {
                    console.error(err);
                    jsonResponse.error = "Internal Server Error";
                    res.status(500);
                    end(res, jsonResponse);                   
                    return;
                }
                var convertedFilePath = path.join(resourcepath, path.parse(newPath).name + ".flac");
                var userID = req.session.user_id;
                transcriber.convertToFLAC(newPath, convertedFilePath, jsonResponse, res, userID, onConversionSuccess, end);
                res.status(202) // accepted
            });
            return; 
        }
        end(res, jsonResponse);
    }
    catch (err) {
        console.error(`An error occured while processing the file ${files.filetoupload.path}` + err);
        jsonResponse.error = "Internal System Error";
        end(res, jsonResponse);
    }
}

module.exports.processFile = processFile;

/**
 * Callback function which will be fired once the file is successfully converted to flac
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
            values: [userID, path.parse(srcFile).base, srcFile, 'Not Started']
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
            values: [(res.statusCode == 200) ? 'Success' : 'Failed', jsonResponse, jobID]
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

function processResultRequest(res,finish)
{
    var jsonResponse = {};
    if (!res.req.session.user_id)
    {
        res.status(403);
        finish(res,jsonResponse);
        return;
    }

    const query = {
        text: 'SELECT file_name, status, transcript FROM jobs WHERE user_id = $1;',
        values: [res.req.session.user_id]
    }
    dbhandler.executeQuery(query)
        .then(result => {
            console.log(result);
            res.status(200);
            jsonResponse = result.rows;
        })
        .catch(err => {
            console.error("An error occured during executing a DB query :\n", err);
            res.status(500);
        })
        .finally(() => {
            finish(res,jsonResponse);
        })
}

module.exports.processResultRequest = processResultRequest