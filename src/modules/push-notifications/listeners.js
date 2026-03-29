const { getDb } = require("../../config/database");
const { eventBus } = require("../../shared/services/event-bus");
const { sendPushNotification } = require("./service");

function setupPushListeners() {
  eventBus.on("workout.completed", async ({ session, userId }) => {
    await sendPushToUser(userId, {
      title: "Workout Complete!",
      body: session?.name ? `Great job finishing "${session.name}"!` : "Great job finishing your workout!",
      data: { type: "workout_completed", sessionId: session?.id },
    });
  });

  eventBus.on("personal_record.set", async ({ record, userId }) => {
    await sendPushToUser(userId, {
      title: "New Personal Record!",
      body: `You set a new PR: ${record?.weight_kg}kg!`,
      data: { type: "personal_record", recordId: record?.id },
    });
  });

  eventBus.on("session.approved", async ({ session }) => {
    if (session?.client_id) {
      await sendPushToUser(session.client_id, {
        title: "Session Approved",
        body: "Your training session has been approved!",
        data: { type: "session_approved", sessionId: session?.id },
      });
    }
  });

  eventBus.on("workout.assigned", async ({ assignment }) => {
    if (assignment?.client_id) {
      await sendPushToUser(assignment.client_id, {
        title: "New Workout Assigned",
        body: "Your trainer assigned you a new workout!",
        data: { type: "workout_assigned", assignmentId: assignment?.id },
      });
    }
  });

  eventBus.on("challenge.created", async ({ challenge }) => {
    // Notify all active users about public challenges
    if (challenge?.is_public) {
      const db = getDb();
      const users = db.prepare("SELECT id FROM users WHERE status = 'active' AND id != ?").all(challenge.created_by);
      for (const user of users.slice(0, 100)) {
        await sendPushToUser(user.id, {
          title: "New Challenge!",
          body: `"${challenge.title}" - Join now!`,
          data: { type: "challenge_created", challengeId: challenge.id },
        });
      }
    }
  });

  eventBus.on("insight.generated", async ({ insight, userId }) => {
    await sendPushToUser(userId, {
      title: "New AI Insight",
      body: insight?.title || "You have a new personalized insight!",
      data: { type: "insight", insightId: insight?.id },
    });
  });
}

async function sendPushToUser(userId, notification) {
  try {
    const db = getDb();
    const tokens = db
      .prepare("SELECT token, platform FROM device_tokens WHERE user_id = ? AND is_active = 1")
      .all(userId);

    for (const { token, platform } of tokens) {
      await sendPushNotification(token, notification, platform);
    }
  } catch (err) {
    console.error("Push notification error:", err.message);
  }
}

module.exports = { setupPushListeners };
