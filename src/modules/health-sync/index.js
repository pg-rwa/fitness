const routes = require("./routes");

module.exports = {
  name: "health-sync",
  register(app) {
    app.use("/api/health-sync", routes);
  },
};
