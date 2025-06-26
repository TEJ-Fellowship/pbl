import React from "react";
import PostForm from "./PostForm";
import { User } from "lucide-react";
import TaskCard from "./TaskCard";

const MainContent = ({
  categories,
  showPostForm,
  handleSetShowPostForm,
  selectedCategory,
}) => {
  const tasks = [
    {
      id: 1,
      user: "Sarah Martinez",
      avatar: "👩‍🦰",
      time: "2 hours ago",
      category: "groceries",
      urgency: "medium",
      title: "Need groceries picked up from Whole Foods",
      description:
        "I'm recovering from surgery and need someone to pick up a few essentials. I have a list ready and can pay via app.",
      location: "0.3 miles away",
      likes: 12,
      comments: 5,
      helpers: 3,
      karma: 45,
      status: "open",
    },
    {
      id: 2,
      user: "Mike Rodriguez",
      avatar: "👨‍🦲",
      time: "4 hours ago",
      category: "tech",
      urgency: "low",
      title: "Help setting up new smart TV",
      description:
        'Just got a new 65" smart TV and need help mounting it on the wall and connecting to WiFi. Pizza and drinks provided!',
      location: "0.7 miles away",
      likes: 8,
      comments: 12,
      helpers: 1,
      karma: 32,
      status: "in-progress",
    },
    {
      id: 3,
      user: "Emma Chen",
      avatar: "👩‍🦱",
      time: "6 hours ago",
      category: "pets",
      urgency: "high",
      title: "Emergency dog walking needed",
      description:
        "My Golden Retriever Max needs an urgent walk. I'm stuck at work and he's been inside for 8 hours. He's very friendly!",
      location: "0.5 miles away",
      likes: 24,
      comments: 8,
      helpers: 5,
      karma: 67,
      status: "completed",
    },
  ];

  return (
    <>
      <div className="px-6 pb-20 dark:bg-background-humbleDark dark:text-text-spotlight">
        {/* What's on your mind */}
        {!showPostForm && (
          <div
            onClick={() => handleSetShowPostForm(true)}
            className="bg-background dark:bg-background-politeDark rounded-2xl shadow-sm border border-border dark:border-border-dark p-4 mb-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-light to-primary rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-background dark:text-text-spotlight" />
              </div>
              <div className="flex-1 text-text-light">
                What help do you need today?
              </div>
              <div className="flex space-x-2">
                <div className="w-8 h-8 bg-status-success-bg rounded-full flex items-center justify-center">
                  <span className="text-sm">🛒</span>
                </div>
                <div className="w-8 h-8 bg-status-warning-bg rounded-full flex items-center justify-center">
                  <span className="text-sm">💻</span>
                </div>
                <div className="w-8 h-8 bg-status-error-bg rounded-full flex items-center justify-center">
                  <span className="text-sm">🐕</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPostForm && (
          <PostForm
            categories={categories}
            handleSetShowPostForm={handleSetShowPostForm}
          />
        )}

        {/* Tasks Feed */}
        <div className="space-y-4">
          {tasks
            .filter(
              (task) =>
                selectedCategory === "all" || task.category === selectedCategory
            )
            .map((task) => (
              <TaskCard key={task.id} task={task} categories={categories} />
            ))}
        </div>
      </div>
    </>
  );
};

export default MainContent;
