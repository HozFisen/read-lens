'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserPreference extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UserPreference.belongsTo(models.User, {foreignKey: 'userId'})
    }
  }
  UserPreference.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {msg: "userId is required"},
        notEmpty: {msg: "userId is required"}
      }
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {msg: "Subject is required"},
        notEmpty: {msg: "Subject is required"}
      }
    },
    weight: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    }
  }, {
    sequelize,
    modelName: 'UserPreference',
  });
  UserPreference.beforeCreate((user) => {
    user.subject = user.subject.toLowerCase()
  })
  return UserPreference;
};