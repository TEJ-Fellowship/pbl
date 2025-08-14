const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX =
  /^\+?[1-9]\d{0,2}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const PROF_PICTURE_URL_REGEX = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i;

module.exports = {
  EMAIL_REGEX,
  PHONE_REGEX,
  PASSWORD_REGEX,
  PROF_PICTURE_URL_REGEX,
};
