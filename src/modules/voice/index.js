const routes = require("./routes");

module.exports = {
  name: "voice",
  register(app) {
    app.use("/api/voice", routes);
  },
};
