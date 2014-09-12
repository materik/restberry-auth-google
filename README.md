Restberry-Auth-Google
=====================

Passport-google-oauth wrapper for Restberry Auth.

## Install

```
npm install restberry-auth-google
```

## Usage

```
var restberryAuth = require('restberry-auth');
var restberryAuthGoogle = require('restberry-auth-google');

restberry
    .use(restberryAuth.use(function(auth) {
            ...
        })
        .use(restberryAuthGoogle.config({
            clientID: ...,
            clientSecret: ...,
            callbackHost: ...,
            returnURL: ...,
        });
```

Two new routes have been created to the User: GET /login/google and GET
/login/google/callback.
