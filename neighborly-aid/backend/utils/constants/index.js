const { OPEN, IN_PROGRESS, COMPLETED } = require("./taskStatus");
const { HELPER, REQUESTER, ADMIN } = require("./userRole");
const { LOW, MEDIUM, HIGH } = require("./taskUrgency");
const {
  PENDING,
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
  PENDING,
  ACCEPTED,
  DECLINED,

  // Event Status for event
  UPCOMING,
  ONGOING,
  CLOSED,
  CANCELLED,
};
