const routes = require("./routes");

module.exports = {
  name: "scheduling",
  register(app) {
    app.use("/api/scheduling", routes);
  },
};
