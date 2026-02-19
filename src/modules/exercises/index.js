const routes = require("./routes");

function register(app) {
  app.use("/api/exercises", routes);
}

module.exports = { register };
