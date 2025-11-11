const bcrypt = require('bcryptjs')

function hashPassword(password) {
    return bcrypt.hash(password, 10)
}

function comparePassword(password, hashedPassword) {
    return bcrypt.compareSync(password, hashedPassword)
}

module.exports = {hashPassword, comparePassword}