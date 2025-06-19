import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";

export default function ProjectSubmissionModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    githubUrl: "",
    liveUrl: "",
    technologies: [],
    screenshots: [],
    collaborators: [{ name: "", githubUsername: "", role: "" }],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTechnologiesChange = (e) => {
    const technologies = e.target.value.split(",").map((tech) => tech.trim());
    setFormData((prev) => ({
      ...prev,
      technologies,
    }));
  };

  const handleCollaboratorChange = (index, field, value) => {
    setFormData((prev) => {
      const newCollaborators = [...prev.collaborators];
      newCollaborators[index] = {
        ...newCollaborators[index],
        [field]: value,
      };
      return {
        ...prev,
        collaborators: newCollaborators,
      };
    });
  };

  const addCollaborator = () => {
    setFormData((prev) => ({
      ...prev,
      collaborators: [
        ...prev.collaborators,
        { name: "", githubUsername: "", role: "" },
      ],
    }));
  };

  const removeCollaborator = (index) => {
    setFormData((prev) => ({
      ...prev,
      collaborators: prev.collaborators.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/projects`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit project");
      }

      onClose();
      // You might want to add a success notification here
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-full p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl p-8 overflow-hidden transition-all transform bg-white rounded-2xl shadow-large border border-surface-200">
                <Dialog.Title
                  as="h3"
                  className="mb-6 text-2xl font-bold leading-7 text-surface-900"
                >
                  Submit Your Project
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 text-sm text-primary-700 bg-primary-50 rounded-xl border border-primary-200">
                      {error}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-semibold text-surface-700 mb-2"
                    >
                      Project Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Enter your amazing project title"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-semibold text-surface-700 mb-2"
                    >
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      required
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="input-field resize-none"
                      placeholder="Tell us about your amazing project..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="githubUrl"
                        className="block text-sm font-semibold text-surface-700 mb-2"
                      >
                        GitHub URL *
                      </label>
                      <input
                        type="url"
                        id="githubUrl"
                        name="githubUrl"
                        required
                        value={formData.githubUrl}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="https://github.com/username/repo"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="liveUrl"
                        className="block text-sm font-semibold text-surface-700 mb-2"
                      >
                        Live Demo URL
                      </label>
                      <input
                        type="url"
                        id="liveUrl"
                        name="liveUrl"
                        value={formData.liveUrl}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="https://your-project.vercel.app"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="technologies"
                      className="block text-sm font-semibold text-surface-700 mb-2"
                    >
                      Technologies Used *
                    </label>
                    <input
                      type="text"
                      id="technologies"
                      name="technologies"
                      required
                      value={formData.technologies.join(", ")}
                      onChange={handleTechnologiesChange}
                      className="input-field"
                      placeholder="React, Node.js, MongoDB, Tailwind CSS (comma-separated)"
                    />
                  </div>

                  <div>
                    <label className="block mb-3 text-sm font-semibold text-surface-700">
                      Team Collaborators
                    </label>
                    <div className="space-y-3">
                      {formData.collaborators.map((collaborator, index) => (
                        <div
                          key={index}
                          className="flex gap-3 p-4 bg-surface-50 rounded-xl border border-surface-200"
                        >
                          <input
                            type="text"
                            value={collaborator.name}
                            onChange={(e) =>
                              handleCollaboratorChange(
                                index,
                                "name",
                                e.target.value
                              )
                            }
                            placeholder="Full Name"
                            className="flex-1 input-field"
                          />
                          <input
                            type="text"
                            value={collaborator.githubUsername}
                            onChange={(e) =>
                              handleCollaboratorChange(
                                index,
                                "githubUsername",
                                e.target.value
                              )
                            }
                            placeholder="GitHub Username"
                            className="flex-1 input-field"
                          />
                          <input
                            type="text"
                            value={collaborator.role}
                            onChange={(e) =>
                              handleCollaboratorChange(
                                index,
                                "role",
                                e.target.value
                              )
                            }
                            placeholder="Role (e.g., Frontend, Backend)"
                            className="flex-1 input-field"
                          />
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() => removeCollaborator(index)}
                              className="p-2 text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addCollaborator}
                      className="mt-4 btn btn-secondary w-full"
                    >
                      + Add Team Member
                    </button>
                  </div>

                  <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-surface-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn btn-secondary px-6"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary px-8"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Submitting...
                        </div>
                      ) : (
                        "Submit Project"
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
