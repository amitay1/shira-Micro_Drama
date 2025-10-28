const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

// ====================
// User Model
// ====================
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Must be a valid email address'
      }
    }
  },
  
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: {
        args: [8, 100],
        msg: 'Password must be between 8 and 100 characters'
      }
    }
  },
  
  full_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: {
        args: [2, 255],
        msg: 'Full name must be between 2 and 255 characters'
      }
    }
  },
  
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: {
        args: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
        msg: 'Must be a valid phone number'
      }
    }
  },
  
  profile_picture: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: true,
      isBefore: {
        args: new Date().toISOString().split('T')[0],
        msg: 'Date of birth must be in the past'
      }
    }
  },
  
  country: {
    type: DataTypes.STRING(2),
    allowNull: true,
    validate: {
      len: [2, 2]
    }
  },
  
  language: {
    type: DataTypes.STRING(5),
    defaultValue: 'en',
    validate: {
      isIn: {
        args: [['en', 'he', 'ar', 'es', 'fr']],
        msg: 'Language must be one of: en, he, ar, es, fr'
      }
    }
  },
  
  role: {
    type: DataTypes.ENUM('user', 'admin', 'superadmin', 'content_creator'),
    defaultValue: 'user'
  },
  
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  verification_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  reset_password_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  reset_password_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  login_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  is_banned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  ban_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      notifications_enabled: true,
      email_notifications: true,
      auto_play: true,
      video_quality: 'auto',
      subtitle_language: null
    }
  },
  
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['role'] },
    { fields: ['is_active'] },
    { fields: ['created_at'] }
  ]
});

// ====================
// Instance Methods
// ====================

/**
 * Check if provided password matches hashed password
 */
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Convert user to safe JSON (exclude sensitive data)
 */
User.prototype.toSafeObject = function() {
  const user = this.toJSON();
  delete user.password;
  delete user.verification_token;
  delete user.reset_password_token;
  delete user.reset_password_expires;
  return user;
};

// ====================
// Hooks
// ====================

/**
 * Hash password before creating user
 */
User.beforeCreate(async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

/**
 * Hash password before updating if it was changed
 */
User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// ====================
// Class Methods
// ====================

/**
 * Find user by email
 */
User.findByEmail = async function(email) {
  return await this.findOne({ where: { email: email.toLowerCase() } });
};

/**
 * Find active user by ID
 */
User.findActiveById = async function(userId) {
  return await this.findOne({
    where: { 
      id: userId,
      is_active: true,
      is_banned: false
    }
  });
};

// ====================
// Exports
// ====================
module.exports = User;
