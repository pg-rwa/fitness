const routes = require("./routes");

function register(app) {
  app.use("/api/goals", routes);
}

module.exports = { register };
