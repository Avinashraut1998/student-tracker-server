const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    homework: [{ type: mongoose.Schema.Types.ObjectId, ref: "Homework" }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Teacher", teacherSchema);
