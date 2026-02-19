const routes = require("./routes");

function register(app) {
  app.use("/api/auth", routes);
}

module.exports = { register };
