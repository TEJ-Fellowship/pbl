// async handler wraps an asynchronous function and catches any errors
function asyncHandler(callBackFunc) {
  return function wrapped(req, res, next) {
    // Promise.resolve(): returns a new Promise object that is resolved with the value of the callback function
    // .then(): returns a new Promise object that is resolved with the value of the callback function
    // .catch(): returns a new Promise object that is rejected with the value of the callback function
    return Promise.resolve()
      .then(() => callBackFunc(req, res, next))
      .catch(next);
  };
}
module.exports = asyncHandler;
