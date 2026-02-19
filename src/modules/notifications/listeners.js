const { createNotification } = require("./service");
const { getDb } = require("../../config/database");

function setupListeners(eventBus) {
  eventBus.on("session.requested", ({ session }) => {
    // Notify trainer when client requests a session
    if (session.requested_by === "client") {
      createNotification({
        userId: session.trainer_id,
        type: "session_request",
        title: "New Session Request",
        body: `A client has requested a session: ${session.title}`,
        data: { sessionId: session.id },
      });
    }
  });

  eventBus.on("session.approved", ({ session }) => {
    createNotification({
      userId: session.client_id,
      type: "session_approved",
      title: "Session Approved",
      body: `Your session "${session.title}" has been approved`,
      data: { sessionId: session.id },
    });
  });

  eventBus.on("session.declined", ({ session }) => {
    createNotification({
      userId: session.client_id,
      type: "session_declined",
      title: "Session Declined",
      body: `Your session "${session.title}" was declined${session.decline_reason ? ": " + session.decline_reason : ""}`,
      data: { sessionId: session.id },
    });
  });

  eventBus.on("workout.assigned", ({ assignment, clientId }) => {
    createNotification({
      userId: clientId,
      type: "workout_assigned",
      title: "New Workout Assigned",
      body: `You have a new workout assigned: ${assignment.template_name}`,
      data: { assignmentId: assignment.id },
    });
  });

  eventBus.on("workout.completed", ({ session, personalRecords }) => {
    if (personalRecords && personalRecords.length > 0) {
      // Notify the user about their PR
      createNotification({
        userId: session.user_id,
        type: "personal_record",
        title: "New Personal Record!",
        body: `You set ${personalRecords.length} new personal record(s)!`,
        data: { sessionId: session.id, records: personalRecords },
      });

      // Notify trainer if user has one
      const db = getDb();
      const user = db.prepare("SELECT trainer_id FROM users WHERE id = ?").get(session.user_id);
      if (user && user.trainer_id) {
        createNotification({
          userId: user.trainer_id,
          type: "client_pr",
          title: "Client Set a PR!",
          body: `Your client set ${personalRecords.length} new personal record(s)`,
          data: { sessionId: session.id, clientId: session.user_id },
        });
      }
    }
  });
}

module.exports = { setupListeners };
