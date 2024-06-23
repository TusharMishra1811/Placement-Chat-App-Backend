import { CHATAPP_TOKEN } from "../constants/config.js";
import { User } from "../models/user.models.js";
import { ErrorHendler } from "../utils/utility.js";
import { TryCatch } from "./error.middleware.js";
import jwt from "jsonwebtoken";

const isAuthenticated = TryCatch(async (req, res, next) => {
  const token = req.cookies[CHATAPP_TOKEN];
  if (!token) {
    return next(new ErrorHendler("Please login to access this route", 401));
  }

  const decodedData = jwt.verify(token, process.env.JWT_SECRET);

  req.user = decodedData._id;

  next();
});

const adminOnly = (req, res, next) => {
  const token = req.cookies["chat-admin-token"];
  if (!token)
    return next(new ErrorHendler("Only Admin can access this route", 401));

  const secretKey = jwt.verify(token, process.env.JWT_SECRET);
  const adminSecretKey = process.env.ADMIN_SECRET_KEYS;
  const isMatched = secretKey === adminSecretKey;

  if (!isMatched)
    return next(new ErrorHendler("Only Admin can access this route", 401));

  next();
};

const socketAuthenticator = async (err, socket, next) => {
  try {
    if (err) return next(err);

    const authToken = socket.request.cookies[CHATAPP_TOKEN];

    if (!authToken)
      return next(new ErrorHendler("Please login to access this route", 401));

    const decodedData = jwt.verify(authToken, process.env.JWT_SECRET);

    const user = await User.findById(decodedData._id);

    if (!user)
      return next(new ErrorHendler("Please Login to access this route", 401));

    socket.user = user;

    return next();
  } catch (error) {
    return next(new ErrorHendler("Please Login to access this route", 401));
  }
};

export { isAuthenticated, adminOnly, socketAuthenticator };
