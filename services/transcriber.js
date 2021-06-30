const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
module.exports = { convertToFLAC, transcribe };

const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

const speechToText = new SpeechToTextV1({
    authenticator: new IamAuthenticator({
        apikey: process.env.STT_API_KEY
    }),
    serviceUrl: process.env.STT_SERVICE_URL
});

/**
 * Converts .mp4 and .m4a files to .flac
 * @param  {String} srcFile  path of the source .m4a or .mp4 file
 * @param  {String} destFile path to the destination .flac file
 * @param  {JSON} jsonResponse JSON response to be sent back to browser
 * @param  {Express.Response} res HTTP response object 
 * @param  {INT} userID user_id of who initiated the request
 * @param  {Function} success Callback function to be fired upon successful conversion.
 * @param  {Function} end Callback function to be fired to deliver the HTTP response.
 * @return NONE
 */
function convertToFLAC(srcFile, destFile, jsonResponse, res, userID, success, end) {
    console.log(`${srcFile} is being converted`);
    ffmpeg(srcFile)
        .on('error', (err) => {
            console.error('An error occurred during ffmpeg conversion: ' + err.message);
            jsonResponse.error = "Internal Server Error";
            res.status(500);
            if (end) end(res,jsonResponse);
        })
        .on('progress', (progress) => {
            console.log(`Converting file : ${srcFile} | ` + progress.targetSize + ' KB converted');
        })
        .on('end', () => {
            console.log(`${srcFile} have been successfully converted!`);
            console.log(`Converted file ${destFile} has been successfully saved!`);
            if (success) success(srcFile, destFile, jsonResponse, res, userID, end);
        })
        .save(destFile);
}

/**
 * Connect to Watson STT service and transcribe the input file 
 * @param  {String} file  path of the source .flac file to be transcribed
 * @param  {JSON} jsonResponse JSON response to be sent back to browser
 * @param  {Express.Response} res HTTP response object
 * @param  {INT} jobID  Associated job_id of the transcription request
 * @param  {Function} success Callback function to be fired upon transcription completion.
 * @param  {Function} end Callback function to be fired to deliver the HTTP response.
 * @return NONE
 */
function transcribe(file, jsonResponse, res, jobID, success, end) {
    console.log(`${file} is being transcribed`);
    const recognizeParams = {
        audio: fs.createReadStream(file),
        objectMode: true,
        contentType: 'audio/flac',
        model: 'en-US_Telephony',
        lowLatency: false,

        // Enable following params when implementing model selection
        // backgroundAudioSuppression: 0.3,
        // speakerLabels: true,
        // redaction: true,
    };
    speechToText.recognize(recognizeParams)
        .then(speechRecognitionResults => {
            console.log("Response received from STT service :");
            console.log(JSON.stringify(speechRecognitionResults, null, 2));
            jsonResponse.result = speechRecognitionResults.result.results;
            res.status(200);
        })
        .catch(err => {
            console.error('An error has been returned from STT service: \n', err);
            jsonResponse.result = null;
            jsonResponse.error = "Internal Server Error";
            res.status(500);
        })
        .finally(() => {
            fs.rm(file, (err) => {
                if (err) {
                    console.error(err.message);
                    return;
                }
                console.log(`${file} has been deleted successfully`);
            });
            success(res, jsonResponse,jobID, end);
        })
}

