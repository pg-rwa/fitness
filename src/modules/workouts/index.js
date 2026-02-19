const routes = require("./routes");

function register(app) {
  app.use("/api/workouts", routes);
}

module.exports = { register };
