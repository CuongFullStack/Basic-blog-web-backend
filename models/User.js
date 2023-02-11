const moongoose = require("mongoose");

const UserSchema = new moongoose.Schema({
  username: { type: String, required: true, min: 2, unique: true },
  password: { type: String, required: true },
});

const UserModel = moongoose.model("user", UserSchema);

module.exports = UserModel;
