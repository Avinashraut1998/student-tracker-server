const mongoose = require("mongoose");

const homeworkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
    approvedByAdmin: { type: Boolean, default: false },
    answers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HomeworkAnswer",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Homework", homeworkSchema);
