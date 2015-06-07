var errors = require('restberry-errors');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var logger = require('restberry-logger');

var CALLBACK_PATH = '/login/google/callback';
var DEFAULT_CALLBACK_HOST = 'localhost';
var DEFAULT_RETURN_URL = '/';
var DEFAULT_SCHEMA = {
    email: {type: String, required: true, unique: true, lowercase: true},
    gender: {type: String},
    ids: {
        google: {type: String, required: true},
    },
    image: {type: String},
    name: {
        full: {type: String},
        first: {type: String},
        last: {type: String},
    },
};
var LOGIN_PATH = '/login/google';
var SCOPE = 'email';

function RestberryPassportGoogle() {
    this._configured = false;
    this.schema = DEFAULT_SCHEMA;
    this.callbackHost = DEFAULT_CALLBACK_HOST;
    this.clientID = undefined;
    this.clientSecret = undefined;
    this.returnURL = DEFAULT_RETURN_URL;
};

RestberryPassportGoogle.prototype.callbackURL = function() {
    var apiPath = this.restberry.waf.apiPath;
    return this.callbackHost + apiPath + CALLBACK_PATH;
};

RestberryPassportGoogle.prototype.config = function(config) {
    if (!this._configured) {
        this._configured = true;
        config = config || {};
        if (config.callbackHost)  this.callbackHost = config.callbackHost;
        if (config.returnURL)  this.returnURL = config.returnURL;
        this.clientID = config.clientID;
        this.clientSecret = config.clientSecret;
    }
    return this;
};

RestberryPassportGoogle.prototype.enable = function(next) {
    var self = this;
    if (!self.clientID || !self.clientSecret) {
        throw new Error('Need to provide clientID and clientSecret for ' +
                        'Google authentication');
    }
    self.passport.use(new GoogleStrategy({
        callbackURL: self.callbackURL(),
        clientID: self.clientID,
        clientSecret: self.clientSecret,
    }, function(_, _, profile, next) {
        logger.info('SESSION', 'google authenticate', profile.id);
        self.getOrCreateUser(profile._json, next);
    }));
    next(self.schema);
};

RestberryPassportGoogle.prototype.getOrCreateUser = function(profile, next) {
    var self = this;
    var User = self.restberry.auth.getUser();
    User.findOne({'ids.google': profile.id}, function(user) {
        var user = User._create({
            email: profile.email,
            gender: profile.gender,
            ids: {
                google: profile.id,
            },
            image: profile.picture,
            name: {
                full: profile.name,
                first: profile.given_name,
                last: profile.family_name,
            },
        });
        user.save(done, function(user) {
            next(undefined, user);
        }, next);
    }, next)
};

RestberryPassportGoogle.prototype.setupRoutes = function() {
    var self = this;
    var onError = self.restberry.waf.handleRes;
    var User = self.restberry.auth.getUser();
    User.routes
        .addCustomRoute({
            _controller: function() {
                return function(req, res, next) { next({}); };
            },
            isLoginRequired: false,
            path: LOGIN_PATH,
            preAction: self.passport.authenticate('google', {
                scope: SCOPE,
            }),
        })
        .addCustomRoute({
            _controller: function() {
                return function(req, res, next) {
                    logger.info('SESSION', 'google login', req.user.getId());
                    req.user.set('timestampLastLogIn', new Date());
                    req.user.save(function() {
                        res.redirect(self.returnURL);
                    });
                };
            },
            isLoginRequired: false,
            path: CALLBACK_PATH,
            preAction: function(req, res, next) {
                self.passport.authenticate('google')(req, res, function(err) {
                    self.restberry.onError(errors.BadRequest, err);
                });
            },
        });
};

RestberryPassportGoogle.prototype.setupUser = function(User) {
    return User;
};

module.exports = exports = new RestberryPassportGoogle;
