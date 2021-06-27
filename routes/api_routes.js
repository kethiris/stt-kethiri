const formidable = require('formidable');
const requestHandler = require("../services/request_handler")
const authenticator = require("../controller/auth_controller")
const path = require("path")

module.exports = function (router) {
    router.get('/', (req, res) => {
        res.redirect('/login');
    });

    // render the file upload form
    router.get('/fileupload', (req, res) => {
        console.log('GET on /fileupload');
        authenticator.authenticate(req, res, onFileUploadFormRequest, onLoginRedirectRequest);
    });

    // parse the upload form
    router.post('/fileupload', (req, res, next) => {
        console.log('POST on /fileupload');
        var form = new formidable.IncomingForm();
        form.parse(req, function (err, fields, files) {
            if (err) next(err);
            requestHandler.processFile(files, req, res, next, onResponse);
        });
    });

    router.get('/login', (req, res) => {
        console.log('GET on /login');
        res.sendFile(path.join(__dirname ,'..','static','login.html'));
    })

    router.post('/login', (req, res) => {
        console.log('POST on /login');
        authenticator.authenticate(req, res, onFileUploadRedirectRequest, onLoginRedirectRequest);
            
    });

    router.get('/logout', (req, res) => {
        console.log('GET on /logout');
        authenticator.authenticate(req, res, onFileUploadRedirectRequest, onLoginRedirectRequest);
    })

    router.post('/logout', (req, res) => {
        console.log('POST on /logout');
        authenticator.logout(req, res, onLoginRedirectRequest);
    })

    router.get('/register', (req, res) => {
        console.log('GET on /register');
        authenticator.authenticate(req, res, onFileUploadRedirectRequest, onRegisterFormRequest);
    })

    router.post('/register', (req, res) => {
        console.log('POST on /register');
        authenticator.register(req, res, onRegisterResponse);
    });

    router.get('/*', (req, res) => {
        res.redirect('/login');
    })
}

function onFileUploadRedirectRequest(res)
{
    res.redirect('/fileupload')
}

function onFileUploadFormRequest(res)
{
    res.sendFile(path.join(__dirname ,'..','static','fileupload.html'));
}

function onLoginRedirectRequest(res,jsonResponse)
{
    if (res.status == 500){
        console.error("Internal Server Error : \n"+ JSON.stringify(jsonResponse, null, 4))
        res.redirect('/login');
    }
    else {
        console.error("Authentication Error : \n"+ JSON.stringify(jsonResponse, null, 4))
        res.render('login', {jsonresponse : jsonResponse});
    }
        
}

function onRegisterFormRequest(res)
{
    res.sendFile(path.join(__dirname ,'..','static','register.html'));  
}

function onResponse(res, jsonResponse)
{
    console.log("Job completed : \n"+ JSON.stringify(jsonResponse, null, 4));
    res.render('index', {jsonresponse : jsonResponse});
}

function onRegisterResponse(res, jsonResponse)
{
    console.log("Registration response : \n"+ JSON.stringify(jsonResponse, null, 4));
    res.render('register', {jsonresponse : jsonResponse});
}