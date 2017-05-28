module.exports = (req, res, next) => {
  req.headers.accept = 'application/json';
  return next();
};