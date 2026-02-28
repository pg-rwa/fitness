/**
 * One-time reset: clear all user-related data for a fresh start.
 * Keeps seed data (exercises, food_items, equipment) intact.
 */
module.exports = {
  up(db) {
    db.exec(`
      -- Auth & identity
      DELETE FROM otp_codes;
      DELETE FROM refresh_tokens;
      DELETE FROM invitations;
      DELETE FROM trainer_requests;

      -- Workout data (child tables first due to FK)
      DELETE FROM exercise_sets;
      DELETE FROM session_exercises;
      DELETE FROM workout_sessions;
      DELETE FROM assigned_workouts;
      DELETE FROM template_exercises;
      DELETE FROM workout_templates;
      DELETE FROM personal_records;

      -- Legacy workout tables (from migration 001)
      DELETE FROM workout_exercise_sets;
      DELETE FROM workout_exercises;
      DELETE FROM workouts;

      -- Progress
      DELETE FROM body_measurements;
      DELETE FROM progress_photos;
      DELETE FROM goals;

      -- Nutrition (user data only — food_items are kept)
      DELETE FROM meal_log_items;
      DELETE FROM meal_logs;
      DELETE FROM meal_preset_items;
      DELETE FROM meal_presets;

      -- Scheduling & notifications
      DELETE FROM scheduled_sessions;
      DELETE FROM trainer_availability;
      DELETE FROM notifications;

      -- Health & AI
      DELETE FROM health_sync_records;
      DELETE FROM ai_insights;

      -- Custom fields (values only — definitions are kept)
      DELETE FROM custom_field_values;

      -- File uploads
      DELETE FROM file_uploads;

      -- User profiles then users
      DELETE FROM user_profiles;
      DELETE FROM users;
    `);
  },

  down(db) {
    // Data deletion cannot be reversed
  },
};
