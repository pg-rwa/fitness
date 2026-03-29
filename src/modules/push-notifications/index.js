const routes = require("./routes");
const { setupPushListeners } = require("./listeners");

function register(app, deps) {
  app.use("/api/devices", routes);
  setupPushListeners();
}

module.exports = { register };
