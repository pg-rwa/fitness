const request = require("supertest");

/**
 * Register a test user through the OTP flow.
 * In test mode, OTP code is always "123456".
 */
async function registerTestUser(app, { email, password, firstName, lastName, role }) {
  const otpType = "registration";

  // Step 1: Send OTP
  await request(app)
    .post("/api/auth/otp/send")
    .send({ email, type: otpType });

  // Step 2: Verify OTP (test code is always 123456)
  const verifyRes = await request(app)
    .post("/api/auth/otp/verify")
    .send({ email, code: "123456", type: otpType });

  const { verificationToken } = verifyRes.body;

  // Step 3: Register with verification token
  const registerRes = await request(app)
    .post("/api/auth/register")
    .send({
      verificationToken,
      password,
      firstName,
      lastName,
      role: role || "client",
    });

  return registerRes;
}

module.exports = { registerTestUser };
