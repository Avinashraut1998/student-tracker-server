const express = require("express");
const jwt = require("jsonwebtoken");
const Teacher = require("../models/teacher.model");
const Homework = require("../models/homework.model");
const HomeworkAnswer = require("../models/homeworkAnswer.model");
const { authenticateJwt } = require("../authenticate");
const router = express.Router();

router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingTeacher = await Teacher.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const newTeacher = new Teacher({ username, email, password: password });
    const savedTeacher = await newTeacher.save();
    res.status(201).json(savedTeacher);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingTeacher = await Teacher.findOne({ email, password });
    console.log(existingTeacher);
    if (existingTeacher) {
      const { _id, username } = existingTeacher;
      const token = jwt.sign(
        { teacherId: _id, username, role: "Teacher" },
        process.env.SECRET,
        {
          expiresIn: "1h",
        }
      );
      res.json({ message: "Logged in successfully", token });
    } else {
      res.status(403).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/create-homework", authenticateJwt, async (req, res) => {
  try {
    const { title, description, createdBy } = req.body;

    // Check if the teacher exists
    const teacher = await Teacher.findById(createdBy);
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    const newHomework = new Homework({
      title,
      description,
      createdBy: teacher._id,
    });

    // Save the homework
    await newHomework.save();

    // Add the homework to the teacher's homeworks array
    teacher.homeworks.push(newHomework._id);
    await teacher.save();

    res.status(201).json({
      message: "Homework created successfully",
      homework: newHomework,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route to fetch all homework for a teacher
router.get("/fetch-homeworks/:teacherId", async (req, res) => {
  try {
    const teacherId = req.params.teacherId;

    // Check if the teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Fetch all homeworks for the teacher
    const homeworks = await Homework.find({ createdBy: teacher._id })
      .populate({
        path: "answers",
        model: "HomeworkAnswer",
        populate: {
          path: "createdBy",
          model: "Student",
          select: "username",
        },
      })
      .populate("createdBy", "username");

    res.status(200).json({ homeworks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get(
  "/approved-homeworks/:teacherId",
  authenticateJwt,
  async (req, res) => {
    try {
      const teacherId = req.params.teacherId;

      // Check if the teacher exists
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }
      // Fetch all approved homeworks
      const approvedHomeworks = await Homework.find({
        createdBy: teacher._id,
        approvedByAdmin: true,
      })
        .populate({
          path: "answers",
          model: "HomeworkAnswer",
          populate: {
            path: "createdBy",
            model: "Student",
            select: "username",
          },
        })
        .populate("createdBy", "username");

      res.status(200).json({ approvedHomeworks });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.put(
  "/change-answer-status/:answerId",
  authenticateJwt,
  async (req, res) => {
    try {
      const { answerId } = req.params;
      const { newStatus } = req.body;

      // Check if the answer exists
      const answer = await HomeworkAnswer.findById(answerId);
      if (!answer) {
        return res.status(404).json({ error: "Answer not found" });
      }

      // Update the status
      answer.status = newStatus;
      await answer.save();

      res.status(200).json({
        message: "Answer status updated successfully",
        answer,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);
module.exports = router;
