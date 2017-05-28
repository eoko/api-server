module.exports = (req, res, err, cb) => {
  res.statusCode = 406;
  res.send({ message: err.message, details: err.errors });
};