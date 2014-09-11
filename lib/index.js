var errors = require('restberry-errors');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var logger = require('restberry-logger');
var modules = require('restberry-modules');


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

function RestberryAuthGoogle() {
    this.schema = DEFAULT_SCHEMA;
    this.callbackHost = DEFAULT_CALLBACK_HOST;
    this.clientID = null;
    this.clientSecret = null;
    this.returnURL = DEFAULT_RETURN_URL;
};

RestberryAuthGoogle.prototype.__proto__ = modules.auth.prototype;

RestberryAuthGoogle.prototype.callbackURL = function() {
    var apiPath = this.restberry.waf.apiPath;
    return this.callbackHost + apiPath + CALLBACK_PATH;
};

RestberryAuthGoogle.prototype.config = function(config) {
    if (!config)  config = {};
    if (config.callbackHost)  this.callbackHost = config.callbackHost;
    if (config.returnURL)  this.returnURL = config.returnURL;
    this.clientID = config.clientID;
    this.clientSecret = config.clientSecret;
    return this;
};

RestberryAuthGoogle.prototype.enable = function(next) {
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

RestberryAuthGoogle.prototype.getOrCreateUser = function(profile, next) {
    var self = this;
    var User = self.restberry.auth.getUser();
    var done = function(err, user, _next) {
        if (err) {
            next(err);
        } else if (user) {
            next(null, User.obj(user));
        } else {
            _next();
        }
    };
    User._findOne({'ids.google': profile.id}, function(err, user) {
        done(err, user, function() {
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
            user._save(done);
        });
    });
};

RestberryAuthGoogle.prototype.setupRoutes = function() {
    var self = this;
    var onError = self.restberry.waf.handleRes;
    var User = self.restberry.auth.getUser();
    User.routes
        .addCustom({
            _controller: function() {
                return function(req, res, next) { next({}); };
            },
            loginRequired: false,
            path: LOGIN_PATH,
            preAction: self.passport.authenticate('google', {
                scope: SCOPE,
            }),
        })
        .addCustom({
            _controller: function() {
                return function(req, res, next) {
                    logger.info('SESSION', 'google login', req.user.getId());
                    req.user.set('timestampLastLogIn', new Date());
                    req.user.save(req, res, function() {
                        res.redirect(self.returnURL);
                    });
                };
            },
            loginRequired: false,
            path: CALLBACK_PATH,
            preAction: self.passport.authenticate('google'),
        });
};

RestberryAuthGoogle.prototype.setupUser = function(User) {
    return User;
};

module.exports = exports = new RestberryAuthGoogle;
