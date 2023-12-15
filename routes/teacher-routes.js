const express = require("express");
const jwt = require("jsonwebtoken");
const Teacher = require("../models/teacher.model");
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
  console.log(req.body);
  try {
    const existingTeacher = await Teacher.findOne({ email, password });
    if (existingTeacher) {
      username = existingTeacher.username;
      const token = jwt.sign(
        { username, role: "Teacher" },
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

module.exports = router;
