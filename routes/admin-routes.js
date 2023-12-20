const express = require("express");
const Admin = require("../models/admin.model");
const Homework = require("../models/homework.model");
const jwt = require("jsonwebtoken");
const { authenticateJwt } = require("../authenticate");
const router = express.Router();

router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const newAdmin = new Admin({ username, email, password });
    const savedAdmin = await newAdmin.save();
    res.status(201).json(savedAdmin);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingAdmin = await Admin.findOne({ email, password });
    if (existingAdmin) {
      username = existingAdmin.username;
      const token = jwt.sign({ username, role: "Admin" }, process.env.SECRET, {
        expiresIn: "1h",
      });
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
    const user = await Admin.findOne({ username: req.user.username });

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

router.get("/homeworks", authenticateJwt, async (req, res) => {
  try {
    // Fetch all homeworks with the specified fields
    const homeworks = await Homework.find()
      .populate("createdBy", "username")
      .select("title approvedByAdmin _id createdBy");

    const formattedHomeworks = homeworks.map((homework) => ({
      homeworkId: homework._id,
      title: homework.title,
      approvedStatus: homework.approvedByAdmin,
      createdBy: homework.createdBy.username,
    }));

    res.status(200).json({ homeworks: formattedHomeworks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put(
  "/approve-homework/:homeworkId",
  authenticateJwt,
  async (req, res) => {
    try {
      const { homeworkId } = req.params;

      // Check if the homework exists
      const homework = await Homework.findById(homeworkId);
      if (!homework) {
        return res.status(404).json({ error: "Homework not found" });
      }

      // Approve the homework
      homework.approvedByAdmin = true;
      await homework.save();

      res.status(200).json({
        message: "Homework approved successfully",
        homework,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

module.exports = router;
