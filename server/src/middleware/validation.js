import { validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const complaintValidation = [
  // validation happens in route
];

export const repairSubmissionValidation = [
  // validation happens in route
];