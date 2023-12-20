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

router.get("/me", authenticateJwt, async (req, res) => {
  try {
    // Fetch the user using the common User model
    const user = await Teacher.findOne({ username: req.user.username });

    if (!user) {
      res.status(403).json({ msg: "User doesn't exist" });
      return;
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      // Include other user details you want to send in the response
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
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

router.get("/fetch-answers/:teacherId", authenticateJwt, async (req, res) => {
  try {
    const teacherId = req.params.teacherId;

    // Check if the teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Fetch all homeworks for the teacher
    const homeworks = await Homework.find({ createdBy: teacher._id });

    // Fetch answers for each homework
    const answersList = [];
    for (const homework of homeworks) {
      const answers = await HomeworkAnswer.find({ homework: homework._id })
        .populate("createdBy", "username")
        .populate({
          path: "createdBy",
          select: "username", // Specify only the fields you need
        })
        .select("answerText _id createdBy status"); // Include the 'status' field

      const formattedAnswers = answers.map((answer) => ({
        homeworkTitle: homework.title,
        answerText: answer.answerText,
        studentName: answer.createdBy.username,
        answerId: answer._id,
        status: answer.status,
      }));

      answersList.push(...formattedAnswers);
    }

    res.status(200).json({ answersList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/fetch-answer/:answerId", authenticateJwt, async (req, res) => {
  try {
    const { answerId } = req.params;

    // Check if the answer exists
    const answer = await HomeworkAnswer.findById(answerId).populate({
      path: "createdBy",
      model: "Student",
      select: "username",
    });

    if (!answer) {
      return res.status(404).json({ error: "Answer not found" });
    }

    // Fetch the associated homework
    const homework = await Homework.findById(answer.homework).select("title");

    // Response with student name, answer text, and homework title
    res.status(200).json({
      studentName: answer.createdBy.username,
      answerText: answer.answerText,
      homeworkTitle: homework.title,
      status: answer.status,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put(
  "/update-answer-status/:answerId",
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
