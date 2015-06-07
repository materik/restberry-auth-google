Restberry-Auth-Google
=====================

[![](https://img.shields.io/npm/v/restberry-auth-google.svg)](https://www.npmjs.com/package/restberry-auth-google) [![](https://img.shields.io/npm/dm/restberry-auth-google.svg)](https://www.npmjs.com/package/restberry-auth-google)

Passport-google-oauth wrapper for Restberry.

## Install

```
npm install restberry-auth-google
```

## Usage

```
var restberryAuth = require('restberry-auth');

var auth = restberryAuth.config(function(auth) {
    ...
})
.use('google', {
    clientID: ...,
    clientSecret: ...,
    callbackHost: ...,
    returnURL: ...,
});

restberry.use(auth);
```

Two new routes have been created to the User: GET /login/google and GET
/login/google/callback.
