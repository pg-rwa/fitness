const routes = require("./routes");

module.exports = {
  name: "custom-fields",
  register(app) {
    app.use("/api/custom-fields", routes);
  },
};
