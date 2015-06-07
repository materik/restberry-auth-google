Restberry-Passport-Google
=========================

[![](https://img.shields.io/npm/v/restberry-passport-google.svg)](https://www.npmjs.com/package/restberry-passport-google) [![](https://img.shields.io/npm/dm/restberry-passport-google.svg)](https://www.npmjs.com/package/restberry-passport-google)

Passport-google-oauth wrapper for Restberry.

## Install

```
npm install restberry-passport-google
```

## Usage

```
var restberryPassport = require('restberry-passport');

var auth = restberryPassport.config(function(auth) {
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
