const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    completedHomework: [
      {
        homeworkId: { type: mongoose.Schema.Types.ObjectId, ref: "Homework" },
        answers: { type: String },
        completionStatus: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Student", studentSchema);
