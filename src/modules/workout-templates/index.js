const routes = require("./routes");

module.exports = {
  name: "workout-templates",
  register(app) {
    app.use("/api/workout-templates", routes);
  },
};
