const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connectionInstant = await mongoose.connect(
      `${process.env.MONGODB_URL}/${process.env.DB_NAME}`
    );
    console.log(
      `\n MongoDB connected !! DB host : ${connectionInstant.connection.host}`
    );
  } catch (error) {
    console.log("Mongo Connection Failed ", error);
    process.exit(1);
  }
};

module.exports = connectDB;
