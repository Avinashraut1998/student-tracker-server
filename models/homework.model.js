const mongoose = require("mongoose");

const homeworkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    approved: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Homework", homeworkSchema);
