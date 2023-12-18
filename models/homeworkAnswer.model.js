const mongoose = require("mongoose");

const homeworkAnswerSchema = new mongoose.Schema(
  {
    answerText: { type: String, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    homework: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Homework",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("HomeworkAnswer", homeworkAnswerSchema);
