module.exports = {
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  refreshTokenExpiresInDays: parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || "30", 10),
  invitationExpiresInDays: parseInt(process.env.INVITATION_EXPIRES_DAYS || "7", 10),
  saltRounds: 10,
};
