const validator = require("validator");

const validateSignupData = (req) => {
  const { userName, firstName, lastName, email, password } = req.body;
  const REQUIRED_FIELDS = [
    "userName",
    "firstName",
    "lastName",
    "emailId",
    "password",
  ];

  //Required fields check
  const isSignUpTrue = REQUIRED_FIELDS.every((field) =>
    Object.keys(req.body).includes(field),
  );

  if (!isSignUpTrue) {
    throw new Error("Missing required fields");
  }

  //Data validation for required fields
  if (!firstName || !lastName) {
    throw new Error("Name is not valid: " + firstName || lastName);
  } else if (!validator.isEmail(emailId)) {
    throw new Error("Email is not valid: " + emailId);
  } else if (!validator.isStrongPassword(password)) {
    throw new Error("Weak password, please enter a strong password");
  }
};

module.exports = {
  validateSignupData,
};
