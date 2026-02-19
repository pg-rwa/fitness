const service = require("./service");

async function register(req, res, next) {
  try {
    const result = await service.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await service.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await service.refresh(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await service.logout(req.body);
    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
}

async function createInvitation(req, res, next) {
  try {
    const result = await service.createInvitation({
      email: req.body.email,
      role: req.body.role,
      invitedBy: req.userId,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function acceptInvitation(req, res, next) {
  try {
    const result = await service.acceptInvitation(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function listInvitations(req, res, next) {
  try {
    const invitations = service.listInvitations(req.userId);
    res.json(invitations);
  } catch (err) {
    next(err);
  }
}

async function revokeInvitation(req, res, next) {
  try {
    const result = service.revokeInvitation(parseInt(req.params.id, 10), req.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  createInvitation,
  acceptInvitation,
  listInvitations,
  revokeInvitation,
};
