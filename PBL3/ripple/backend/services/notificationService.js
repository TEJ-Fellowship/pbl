import Notification from "../models/Notification.js";

const getNotifications = async (userId) => {
  const notifications = await Notification.find({
    $or: [
      { userId, type: "friend_ripple" },
      { userId: null, type: "global_ripple" },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();
  return notifications;
};

const deleteAllNotifications = async () => {
  try {
    await Notification.deleteMany({});
    console.log("All notifications deleted!");
  } catch (err) {
    console.error(err);
  }
};
export default { getNotifications, deleteAllNotifications };
