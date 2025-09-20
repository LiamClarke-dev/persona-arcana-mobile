const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User');

// Configure Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
      scope: ['profile', 'email'], // Basic profile only
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('Google OAuth callback received for user:', profile.id);
        
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Update existing user with latest Google profile info
          user.name = profile.displayName;
          user.googleImage = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
          user.email = profile.emails && profile.emails[0] ? profile.emails[0].value : user.email;
          await user.save();
          
          console.log('Updated existing user:', user.email);
          return done(null, user);
        }

        // Create new user
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        
        if (!email) {
          return done(new Error('No email provided by Google'), null);
        }

        user = await User.create({
          googleId: profile.id,
          email: email,
          name: profile.displayName,
          googleImage: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
        });

        console.log('Created new user:', user.email);
        return done(null, user);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }
  )
);

// Configure JWT strategy for API authentication
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await User.findById(payload.userId);
        
        if (user) {
          return done(null, user);
        }
        
        return done(null, false);
      } catch (error) {
        console.error('JWT authentication error:', error);
        return done(error, false);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;