const routes = require("./routes");

function register(app) {
  app.use("/api/social", routes);
}

module.exports = { register };
