const routes = require("./routes");
const { setFeaturesRef } = require("./controller");

module.exports = {
  name: "admin",
  register(app, deps) {
    if (deps.features) {
      setFeaturesRef(deps.features);
    }
    app.use("/api/admin", routes);
  },
};
