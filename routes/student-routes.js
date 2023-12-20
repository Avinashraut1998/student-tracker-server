const express = require("express");
const Student = require("../models/student.model");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { authenticateJwt } = require("../authenticate");
const Homework = require("../models/homework.model");
const Teacher = require("../models/teacher.model");
const HomeworkAnswer = require("../models/homeworkAnswer.model");

router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const newStudent = new Student({ username, email, password });
    const savedStudent = await newStudent.save();
    res.status(201).json(savedStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);
  try {
    const existingStudent = await Student.findOne({ email, password });

    if (existingStudent) {
      const { username, _id } = existingStudent;

      const token = jwt.sign(
        { username, studentId: _id, role: "Student" },
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

router.get("/me", authenticateJwt, async (req, res) => {
  try {
    // Fetch the user using the common User model
    const user = await Student.findOne({ username: req.user.username });

    if (!user) {
      res.status(403).json({ msg: "User doesn't exist" });
      return;
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/approved-homeworks", authenticateJwt, async (req, res) => {
  try {
    // Fetch all approved homeworks
    const approvedHomeworks = await Homework.find({
      approvedByAdmin: true,
    }).populate("createdBy", "username _id"); // Populate with both username and _id

    // Extract the required information and create a new array
    const formattedHomeworks = approvedHomeworks.map((homework) => ({
      teacherName: homework.createdBy.username,
      homeworkId: homework._id,
      title: homework.title,
    }));

    res.status(200).json({ approvedHomeworks: formattedHomeworks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get(
  "/single-homework/:homeworkId",
  authenticateJwt,
  async (req, res) => {
    try {
      const { homeworkId } = req.params;

      // Fetch the single approved homework
      const singleHomework = await Homework.findOne({
        _id: homeworkId,
        approvedByAdmin: true,
      }).populate("createdBy", "username _id"); // Populate with both username and _id

      if (!singleHomework) {
        return res
          .status(404)
          .json({ error: "Homework not found or not approved" });
      }

      res.status(200).json({
        singleHomework: {
          teacherId: singleHomework.createdBy._id,
          teacherName: singleHomework.createdBy.username,
          homeworkId: singleHomework._id,
          title: singleHomework.title,
          // Add any other required fields here
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.post(
  "/answer-homework/:homeworkId",
  authenticateJwt,
  async (req, res) => {
    try {
      const { homeworkId } = req.params;
      const { answerText } = req.body;

      // Check if the homework exists and is approved
      const homework = await Homework.findOne({
        _id: homeworkId,
        approvedByAdmin: true,
      });

      if (!homework) {
        return res
          .status(404)
          .json({ error: "Homework not found or not approved" });
      }

      // Create a new homework answer
      const studentId = req.user.studentId;
      const newAnswer = new HomeworkAnswer({
        answerText,
        createdBy: studentId,
        homework: homework._id,
      });

      // Save the answer
      await newAnswer.save();

      // Add the answer to the homework's answers array
      homework.answers.push(newAnswer._id);
      await homework.save();

      // Find the teacher who created the homework
      const teacher = await Teacher.findById(homework.createdBy);
      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }

      // Add the answer to the teacher's homeworks array (for reference)
      teacher.homeworks.push(homework._id);
      await teacher.save();

      // Fetch the updated homework with the title
      const updatedHomework = await Homework.findById(homeworkId).populate(
        "createdBy",
        "username"
      );

      res.status(201).json({
        message: "Homework answer submitted successfully",
        singleHomework: updatedHomework,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

module.exports = router;
