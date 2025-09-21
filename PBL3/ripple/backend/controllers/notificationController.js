import notificationService from "../services/notificationService.js";

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    let notifications = await notificationService.getNotifications(userId);

    if (!Array.isArray(notifications)) notifications = [];

    res.json(
      notifications.map((n) => ({
        ...n,
        sentiment: n.type === "friend_ripple" ? n.sentiment || "pending" : null,
      }))
    );
  } catch (err) {
    console.log("Error fetching notification: ", err);
    res.status(500).json({ message: "server error" });
  }
};

const deleteAllNotifications = async (req, res) => {
  try {
    await notificationService.deleteAllNotifications();
    res.json({ message: "deleted" });
  } catch (err) {
    console.error(err.message);
  }
};

export default { getNotifications, deleteAllNotifications };
