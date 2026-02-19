const routes = require("./routes");

function register(app) {
  app.use("/api/users", routes);
}

module.exports = { register };
