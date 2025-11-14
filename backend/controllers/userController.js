const { User, UserLike, Book } = require('../models');
const { hashPassword, comparePassword } = require('../helpers/bcrypt');
const { generateToken } = require('../helpers/jwt');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class UserController {
  // CREATE
  static async register(req, res, next) {
    try {
      const { email, password, username, role } = req.body;

      // Validation
      if (!email || !password || !username) {
        throw { name: 'ValidationError', message: 'Email, password, and username are required' };
      }

      if (password.length < 6) {
        throw { name: 'ValidationError', message: 'Password must be at least 6 characters long' };
      }

      // Create user with default role
      const user = await User.create({
        email,
        password,
        username,
        role: role || 'user' // Default role
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      // Handle Sequelize unique constraint violations
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0].path;
        error.name = 'DuplicateError';
        error.message = `${field} already exists`;
      }
      next(error);
    }
  }
  static async readUser(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Book,
            through: { 
              model: UserLike,
              attributes: ['createdAt'] // Include when the book was liked
            },
            attributes: ['id', 'olid'] // Only include necessary book fields
          }
        ]
      });
      
      if (!user) {
        throw { name: 'NotFound', message: 'User not found' };
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  };
  static async allUser(req, res, next) {
    try {
      const users = await User.findAll()
      res.status(200).json(users)
    } catch (error) {
      next(error)
    }
  }

  static async updateUsername(req, res, next) {
    try {
      const { id } = req.params;
      const { username } = req.body;

      if (!username) {
        throw { name: 'ValidationError', message: 'Username is required' };
      }

      const user = await User.findByPk(id);
      
      if (!user) {
        throw { name: 'NotFound', message: 'User not found' };
      }

      await user.update({ username });

      // Return user without password
      const updatedUser = user.toJSON();
      delete updatedUser.password;

      res.json({ 
        message: 'Username updated', 
        user: updatedUser 
      });
    } catch (error) {
      next(error);
    }
  }
  static async delete(req, res, next) {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      
      if (!user) {
        throw { name: 'NotFound', message: 'User not found' };
      }

      await user.destroy();

      res.json({ message: 'User deleted' });
    } catch (error) {
      next(error);
    }
  }


  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        throw { name: 'ValidationError', message: 'Email and password are required' };
      }

      // Find user
      const user = await User.findOne({ where: { email } });

      if (!user) {
        throw { name: 'InvalidCredentials', message: 'Invalid email or password' };
      }

      // Compare password
      const isPasswordValid = comparePassword(password, user.password);

      if (!isPasswordValid) {
        throw { name: 'InvalidCredentials', message: 'Invalid email or password' };
      }

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      res.status(200).json({
        message: 'Login successful',
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async googleOAuthLogin(req, res, next) {
    try {
      const { googleToken } = req.body;

      if (!googleToken) {
        throw { name: 'ValidationError', message: 'Google token is required' };
      }

      // Verify Google token
      const ticket = await client.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      const { email, name, sub: googleId } = payload;

      if (!email) {
        throw { name: 'ValidationError', message: 'Email not provided by Google' };
      }

      // Find or create user
      let user = await User.findOne({ where: { email } });

      if (!user) {
        // Create new user with Google OAuth
        // Use a random password since they'll login via Google
        const randomPassword = hashPassword(Math.random().toString(36) + Date.now());

        user = await User.create({
          email,
          password: randomPassword,
          username: name || email.split('@')[0],
          role: 'user'
        });
      }

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      res.status(200).json({
        message: 'Google login successful',
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      // Handle Google OAuth errors
      if (error.message && error.message.includes('Token')) {
        error.name = 'InvalidGoogleToken';
        error.message = 'Invalid Google token';
      }
      next(error);
    }
  }

  static async logout(req, res, next) {
    try {
      // Since we're using JWT tokens (stateless), logout is handled client-side
      // The client should remove the token from storage
      // We just send a success response
      res.status(200).json({
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;