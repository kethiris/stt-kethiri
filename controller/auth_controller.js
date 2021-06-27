const express = require('express');
const bcrypt = require('bcrypt');
var dbhandler = require("./db_controller");
const saltRounds = 10;

/**
 * Register the user 
 * @param  {Express.Request} req HTTP request object 
 * @param  {Express.Response} res HTTP response object 
 * @param  {Function} finish Callback function to deliver the HTTP response.
 * @return NONE
 */
function register(req, res, finish) {
    var currentSession = req.session;
    var username = req.body.username;
    var password = req.body.password;
    var jsonResponse = { "message": null };
    bcrypt.hash(password, saltRounds)
        .then(encrypted => {
            var displayName = req.body.displayname;
            const query = {
                text: 'INSERT INTO users(username, password, display_name, status) VALUES($1, $2, $3, $4) RETURNING user_id',
                values: [username, encrypted, displayName, 'Active']
            }
            dbhandler.executeQuery(query)
                .then(result => {
                    var userID = result.rows[0].user_id;
                    console.log(`New user ${userID} has been added to DB: ` + result);

                    jsonResponse.message = "Successfully registered.";
                    res.status(200);
                    finish(res, jsonResponse);
                })
                .catch(err => {
                    console.error("An error occured during executing a DB query :\n", err);
                    jsonResponse.error = "Internal System Error";
                    res.status(500);
                    finish(res, jsonResponse);
                })
        })
        .catch(err => {
            console.error("An error occured during hashing the password :\n", err);
            jsonResponse.error = "Internal System Error";
            res.status(500);
            finish(res, jsonResponse);
        })
}

/**
 * Logouts the user and clear session
 * @param  {Express.Request} req HTTP request object 
 * @param  {Express.Response} res HTTP response object
 * @param  {Function} success Callback function to deliver the HTTP response.
 * @return NONE
 */
function logout(req, res, success) {
    try {
        var currentSession = req.session;
        if (currentSession.user_id) {
            console.log(`User ${currentSession.user_id} is being logged out.`)
            req.session.destroy();
            success(res);
        }
        else {
            throw TypeError("user_id is not defined");
        }
    }
    catch (error) {
        console.log(error);
        var jsonResponse = { "message": null };
        jsonResponse.error = "Forbidden request";
        res.status(403);
        res.send(JSON.stringify(jsonResponse, null, 4));
    }
}

/**
 * Authenticates the user
 * @param  {Express.Request} req HTTP request object 
 * @param  {Express.Response} res HTTP response object 
 * @param  {Function} success Callback function to be fired upon successful authentication.
 * @param  {Function} redirect Callback function to be fired upon unsuccessful authentication.
 * @return NONE
 */
function authenticate(req, res, success, redirect) {
    try {
        var currentSession = req.session;
        if (currentSession.user_id) {
            console.log(`User ${currentSession.user_id} already authenticated.`)
            success(res);
        }
        else {
            throw TypeError("user_id is not defined");
        }
    } catch (error) {
        if (error instanceof TypeError)
            verifycredentials(req, res, success, redirect);
        else {
            console.log(error);
            var jsonResponse = { "message": null };
            jsonResponse.error = "Forbidden request";
            res.status(403);
            redirect(res, jsonResponse);
            // res.send(JSON.stringify(jsonResponse, null, 4));
        }
    }
}

function verifycredentials(req, res, success, redirect) {
    console.log("Verifying user credentials");
    var currentSession = req.session;
    var username = req.body.username;
    var password = req.body.password;
    var jsonResponse = { "message": null };
    if (username == null || password == null) {
        jsonResponse.error = "Forbidden request";
        redirect(res, jsonResponse);
        return;
    }
    const query = {
        text: 'SELECT user_id, password, status  FROM users WHERE username = $1;',
        values: [username]
    }
    dbhandler.executeQuery(query)
        .then(result => {
            console.log(result);
            var userID = result.rows[0].user_id;
            var retrievedPassword = result.rows[0].password;
            var userStatus = result.rows[0].status;
            bcrypt.compare(password, retrievedPassword)
                .then(same => {
                    if (same == true) {
                        if (userStatus == "Active") {
                            console.log(`user ${userID} successfully authenticated`);
                            currentSession.user_id = userID;
                            success(res);
                        }
                        else if (userStatus == "Suspended") {
                            console.log(`Suspended user ${userID} authentication attempt`);
                            res.status(401);
                            jsonResponse.message = "User suspended";
                            redirect(res,jsonResponse);
                            // res.send(JSON.stringify(jsonResponse, null, 4));
                        }
                    }
                    else {
                        console.log(`user ${userID} authentication failed`);
                        res.status(401);
                        jsonResponse.message = "Invalid credentials"
                        redirect(res,jsonResponse);
                        // res.send(JSON.stringify(jsonResponse, null, 4));
                    }
                })
                .catch(err => {
                    console.error("An error occured during password comparision :\n", err);
                    jsonResponse.error = "Internal System Error";
                    res.status(500);
                    redirect(res,jsonResponse);
                    // res.send(JSON.stringify(jsonResponse, null, 4));
                })

        })
        .catch(err => {
            console.error("An error occured during executing a DB query :\n", err);
            jsonResponse.error = "Internal System Error";
            res.status(500);
            redirect(res,jsonResponse);
            // res.send(JSON.stringify(jsonResponse, null, 4));
        })
}

module.exports.authenticate = authenticate
module.exports.register = register
module.exports.logout = logout
