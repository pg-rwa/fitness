const routes = require("./routes");

module.exports = {
  name: "progress",
  register(app) {
    app.use("/api/progress", routes);
  },
};
