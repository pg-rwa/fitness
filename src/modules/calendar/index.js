const routes = require("./routes");

module.exports = {
  name: "calendar",
  register(app) {
    app.use("/api/calendar", routes);
  },
};
