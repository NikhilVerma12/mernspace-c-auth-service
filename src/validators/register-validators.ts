import { checkSchema } from "express-validator";
// import { IsStrongPasswordOptions } from "express-validator/lib/options";

export default checkSchema({
  email: {
    errorMessage: "Email is required",
    notEmpty: true,
    trim: true,
    isEmail: true,
  },
  firstName: {
    errorMessage: "First name is required",
    notEmpty: true,
    trim: true,
  },
  lastName: {
    errorMessage: "Last name is required",
    notEmpty: true,
    trim: true,
  },
  password: {
    errorMessage: "Password is required",
    notEmpty: true,
    trim: true,
    isLength: {
      options: {
        min: 8,
      },
      errorMessage: "Password must be at least 8 characters long",
    },
  },
});
// export default [body("email").notEmpty().withMessage("Email is required")];
