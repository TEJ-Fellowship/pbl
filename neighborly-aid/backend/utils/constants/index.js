const { OPEN, IN_PROGRESS, COMPLETED } = require("./taskStatus");
const { HELPER, REQUESTER, ADMIN } = require("./userRole");
const { LOW, MEDIUM, HIGH } = require("./taskUrgency");
const {
  PENDING,
  ACTIVE,
  SELECTED,
  REJECTED,
  COMPLETED: HELPER_COMPLETED,
} = require("./helperStatus");
const {
  PENDING: EVENT_PENDING,
  ACCEPTED,
  DECLINED,
  UPCOMING,
  ONGOING,
  CANCELLED,
  CLOSED,
} = require("./eventStatus");

module.exports = {
  // Task Status
  OPEN,
  IN_PROGRESS,
  COMPLETED,

  // Task Urgency
  LOW,
  MEDIUM,
  HIGH,

  // User Roles
  HELPER,
  REQUESTER,
  ADMIN,

  // Event Status for participants
  EVENT_PENDING,
  ACCEPTED,
  DECLINED,

  // Event Status for event
  UPCOMING,
  ONGOING,
  CLOSED,
  CANCELLED,

  // Helper Status
  PENDING,
  ACTIVE,
  SELECTED,
  REJECTED,
  HELPER_COMPLETED,
};
