const fs = require('fs');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
module.exports = { convertToWAV, transcribe };

const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

const speechToText = new SpeechToTextV1({
    authenticator: new IamAuthenticator({
        apikey: process.env.STT_API_KEY
    }),
    serviceUrl: process.env.STT_SERVICE_URL
});

/**
 * Converts .mp4 and .m4a files to .wav
 * @param  {String} srcFile  path of the source .m4a or .mp4 file
 * @param  {String} destFile path to the destination .wav file
 * @param  {JSON} jsonResponse JSON response to be sent back to browser
 * @param  {Express.Response} res HTTP response object 
 * @param  {INT} userID user_id of who initiated the request
 * @param  {Function} finish Callback function to be fired upon successful conversion.
 * @return NONE
 */
function convertToWAV(srcFile, destFile, jsonResponse, res, userID, finish) {
    console.log(`${srcFile} is being converted`);
    ffmpeg(srcFile)
        .on('error', (err) => {
            console.log('An error occurred: ' + err.message);
            jsonResponse.error = err;
        })
        .on('progress', (progress) => {
            console.log(`Converting file : ${srcFile} | ` + progress.targetSize + ' KB converted');
        })
        .on('end', () => {
            console.log(`${srcFile} have been successfully converted!`);
            console.log(`Converted file ${destFile} has been successfully saved!`);
            if (finish) finish(srcFile, destFile, jsonResponse, res, userID);
        })
        .save(destFile);
}

/**
 * Connect to Watson STT service and transcribe the input file 
 * @param  {String} file  path of the source .wav file to be transcribed
 * @param  {JSON} jsonResponse JSON response to be sent back to browser
 * @param  {Express.Response} res HTTP response object
 * @param  {INT} jobID  Associated job_id of the transcription request
 * @param  {Function} success Callback function to be fired upon successful transcription.
 * @return NONE
 */
function transcribe(file, jsonResponse, res, jobID, success) {
    console.log(`${file} is being transcribed`);
    const recognizeParams = {
        audio: fs.createReadStream(file),
        contentType: 'audio/wav',
        model: 'en-US_BroadbandModel',
    };

    speechToText.recognize(recognizeParams)
        .then(speechRecognitionResults => {
            console.log("Response received from STT service :");
            console.log(JSON.stringify(speechRecognitionResults, null, 2));
            jsonResponse.result = speechRecognitionResults.result.results;
            res.status(speechRecognitionResults.status);
            res.send(JSON.stringify(jsonResponse, null, 4));
            success(jobID,speechRecognitionResults.result);
        })
        .catch(err => {
            console.log('An error has been returned from STT service: \n', err);
            jsonResponse.result = null;
            jsonResponse.error = "Internal Server Error";
            res.status(500);
            res.send(JSON.stringify(jsonResponse, null, 4));
        })
        .finally(() => {
            fs.rm(file, (err) => {
                if (err) {
                    console.error(err.message);
                    return;
                }
                console.log(`${file} has been deleted successfully`);
            });
        })
}