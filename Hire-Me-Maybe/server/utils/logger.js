const info = (...params) => {
  console.log(...params);
};

const errorLogger = (...params) => {
  console.error(...params);
};

module.exports = {
  info,
  errorLogger,
};
