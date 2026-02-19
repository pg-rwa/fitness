const routes = require("./routes");

module.exports = {
  name: "workout-sessions",
  register(app) {
    app.use("/api/workout-sessions", routes);
  },
};
