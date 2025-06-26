// frontend/src/services/taskService.js
export const submitTaskAction = async (formData) => {
  // Simulate API call - replace with actual task creation API
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const taskData = {
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    urgency: formData.get("urgency"),
    location: formData.get("location"),
    taskKarmaPoints: parseInt(formData.get("karmaPoints")) || 10,
  };

  console.log("Task submitted:", taskData);

  // Simulate potential error
  if (Math.random() > 0.8) {
    throw new Error("Failed to create task. Please try again.");
  }

  return { success: true, data: taskData };
};
