const routes = require("./routes");

module.exports = {
  name: "nutrition",
  register(app) {
    app.use("/api/nutrition", routes);
  },
};
