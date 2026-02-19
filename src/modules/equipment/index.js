const routes = require("./routes");

module.exports = {
  name: "equipment",
  register(app) {
    app.use("/api/equipment", routes);
  },
};
