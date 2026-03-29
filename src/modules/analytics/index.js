const routes = require("./routes");

function register(app) {
  app.use("/api/analytics", routes);
}

module.exports = { register };
