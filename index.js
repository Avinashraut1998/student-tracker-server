require("dotenv").config();
const express = require("express");
const connectDB = require("./db");
const app = express();

app.use(express.json());

const teacherRoutes = require("./routes/teacher-routes");
const adminRoutes = require("./routes/admin-routes");
const studentRoutes = require("./routes/student-routes");

app.use("/teacher", teacherRoutes);
app.use("/Admin", adminRoutes);
app.use("/student", studentRoutes);

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server running on port : `, process.env.PORT);
    });
  })
  .catch((error) => {
    console.log(`MongoDB Connection failed !!  `, error);
  });
