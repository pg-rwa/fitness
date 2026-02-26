const { createNotification } = require("./service");
const { getDb } = require("../../config/database");
const { wsManager } = require("../../shared/services/websocket");
const {
  sessionApprovedEmail,
  sessionDeclinedEmail,
  sessionRequestEmail,
} = require("../../shared/services/email");

function getUserEmail(userId) {
  try {
    const db = getDb();
    const user = db.prepare("SELECT email, first_name || ' ' || last_name AS name FROM users WHERE id = ?").get(userId);
    return user;
  } catch {
    return null;
  }
}

function notifyAndPush(payload) {
  const notification = createNotification(payload);
  // Push real-time via WebSocket
  wsManager.send(payload.userId, {
    type: "notification",
    data: notification,
  });
  return notification;
}

function setupListeners(eventBus) {
  eventBus.on("session.requested", ({ session }) => {
    if (session.requested_by === "client") {
      notifyAndPush({
        userId: session.trainer_id,
        type: "session_request",
        title: "New Session Request",
        body: `A client has requested a session: ${session.title}`,
        data: { sessionId: session.id },
      });

      // Send email to trainer
      const trainer = getUserEmail(session.trainer_id);
      const client = getUserEmail(session.client_id);
      if (trainer && trainer.email) {
        sessionRequestEmail(trainer.email, session, client ? client.name : "A client");
      }
    }
  });

  eventBus.on("session.approved", ({ session }) => {
    notifyAndPush({
      userId: session.client_id,
      type: "session_approved",
      title: "Session Approved",
      body: `Your session "${session.title}" has been approved`,
      data: { sessionId: session.id },
    });

    // Send email to client
    const client = getUserEmail(session.client_id);
    if (client && client.email) {
      sessionApprovedEmail(client.email, session);
    }
  });

  eventBus.on("session.declined", ({ session }) => {
    notifyAndPush({
      userId: session.client_id,
      type: "session_declined",
      title: "Session Declined",
      body: `Your session "${session.title}" was declined${session.decline_reason ? ": " + session.decline_reason : ""}`,
      data: { sessionId: session.id },
    });

    const client = getUserEmail(session.client_id);
    if (client && client.email) {
      sessionDeclinedEmail(client.email, session);
    }
  });

  eventBus.on("workout.assigned", ({ assignment, clientId }) => {
    notifyAndPush({
      userId: clientId,
      type: "workout_assigned",
      title: "New Workout Assigned",
      body: `You have a new workout assigned: ${assignment.template_name}`,
      data: { assignmentId: assignment.id },
    });
  });

  eventBus.on("workout.completed", ({ session, personalRecords }) => {
    if (personalRecords && personalRecords.length > 0) {
      notifyAndPush({
        userId: session.user_id,
        type: "personal_record",
        title: "New Personal Record!",
        body: `You set ${personalRecords.length} new personal record(s)!`,
        data: { sessionId: session.id, records: personalRecords },
      });

      const db = getDb();
      const user = db.prepare("SELECT trainer_id FROM users WHERE id = ?").get(session.user_id);
      if (user && user.trainer_id) {
        notifyAndPush({
          userId: user.trainer_id,
          type: "client_pr",
          title: "Client Set a PR!",
          body: `Your client set ${personalRecords.length} new personal record(s)`,
          data: { sessionId: session.id, clientId: session.user_id },
        });
      }
    }
  });

  // ─── Trainer Request Events ──────────────────────────────────

  eventBus.on("trainer.request.sent", ({ request, trainerId, trainerName, clientId }) => {
    notifyAndPush({
      userId: clientId,
      type: "trainer_request",
      title: "Trainer Request",
      body: `${trainerName} wants to add you as a client`,
      data: { requestId: request.id, trainerId },
    });
  });

  eventBus.on("trainer.request.approved", ({ request, trainerId, clientId }) => {
    const client = getUserEmail(clientId);
    notifyAndPush({
      userId: trainerId,
      type: "trainer_request_approved",
      title: "Request Approved",
      body: `${client ? client.name : "A client"} accepted your trainer request`,
      data: { requestId: request.id, clientId },
    });
  });

  eventBus.on("trainer.request.declined", ({ request, trainerId, clientId }) => {
    const client = getUserEmail(clientId);
    notifyAndPush({
      userId: trainerId,
      type: "trainer_request_declined",
      title: "Request Declined",
      body: `${client ? client.name : "A client"} declined your trainer request`,
      data: { requestId: request.id, clientId },
    });
  });

  eventBus.on("insight.generated", ({ insights, userId }) => {
    wsManager.send(userId, {
      type: "insights",
      data: insights,
    });
  });
}

module.exports = { setupListeners };
