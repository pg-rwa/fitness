const { ForbiddenError } = require("../utils/errors");

function authorize(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.userRole)) {
      return next(new ForbiddenError());
    }
    next();
  };
}

module.exports = { authorize };
