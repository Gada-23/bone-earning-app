const app = require("./src/app");
const logger = require("./src/utils/logger");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Bone Earn backend listening on port ${PORT}`);
});
