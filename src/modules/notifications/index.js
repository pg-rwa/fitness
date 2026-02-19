const routes = require("./routes");
const { setupListeners } = require("./listeners");

module.exports = {
  name: "notifications",
  register(app, deps) {
    app.use("/api/notifications", routes);
    if (deps.eventBus) {
      setupListeners(deps.eventBus);
    }
  },
};
