const routes = require("./routes");

module.exports = {
  name: "assigned-workouts",
  register(app) {
    app.use("/api/assigned-workouts", routes);
  },
};
