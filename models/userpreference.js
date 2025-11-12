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
    }
  }
  UserPreference.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isNull: {msg: "userId is required"},
        isEmpty: {msg: "userId is required"}
      }
    },
    subject: {
      type: DataTypes.STRING
    },
    weight: {
      type: DataTypes.INTEGER
    }
  }, {
    sequelize,
    modelName: 'UserPreference',
  });
  return UserPreference;
};