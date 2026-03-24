// async handler wraps an asynchronous function and catches any errors
function asyncHandler(callBackFunc) {
  return function wrapped(req, res, next) {
    Promise.resolve(callBackFunc(req, res, next)).catch(next);
  };
}
module.exports = asyncHandler;
