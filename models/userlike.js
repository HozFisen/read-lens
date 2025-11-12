'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserLike extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    this.belongsTo(models.User, { foreignKey: 'userId' });
    this.belongsTo(models.Book, { foreignKey: 'bookId' });
    }
  }
  UserLike.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {msg: "userId is required"},
        notEmpty: {msg: "userId is required"}
      }
    },
    bookId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {msg: "bookId is required"},
        notEmpty: {msg: "bookId is required"}
      }
    },
  }, {
    sequelize,
    modelName: 'UserLike',
  });
  return UserLike;
};