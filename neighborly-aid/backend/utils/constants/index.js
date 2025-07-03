const {
  OPEN,
  IN_PROGRESS,
  AWAITING_APPROVAL,
  COMPLETED,
} = require("./taskStatus");

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
  AWAITING_APPROVAL,
  COMPLETED,

  // Task Urgency
  LOW,
  MEDIUM,
  HIGH,

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
