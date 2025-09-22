import notificationService from "../services/notificationService.js";

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = await notificationService.getNotifications(userId);
    res.json(notifications);
  } catch (err) {
    console.log("Error fetching notification: ", err.message);
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
