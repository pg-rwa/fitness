const routes = require("./routes");

module.exports = {
  name: "ai-insights",
  register(app) {
    app.use("/api/insights", routes);
  },
};
