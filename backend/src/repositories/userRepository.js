const User = require('../models/User');

class UserRepository {
  async findById(id) {
    return User.findById(id);
  }

  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase().trim() });
  }

  async create(userData) {
    const user = new User(userData);
    return user.save();
  }

  async countDocuments(query = {}) {
    return User.countDocuments(query);
  }

  async find(query = {}) {
    return User.find(query);
  }
}

module.exports = new UserRepository();
