const jwt = require("jsonwebtoken");
const User = require("../models/User");

const userAuth = async (req, res, next) => {
  try {
    // Get token from cookies
    const { token } = req.cookies;

    if (!token) {
      throw new Error("Unauthorized: No token provided");
    }

    // Verify token
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    const { _id } = decodedData;

    // Find user by ID
    const user = await User.findById(_id);
    if (!user) {
      throw new Error("Unauthorized: User not found");
    }
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    res.status(401).send("Unauthorized: " + error.message);
  }
};
