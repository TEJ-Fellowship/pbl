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
          <div className="fixed inset-0 bg-black bg-opacity-25" />
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
              <Dialog.Panel className="w-full max-w-2xl p-6 overflow-hidden transition-all transform bg-white rounded-lg shadow-xl">
                <Dialog.Title
                  as="h3"
                  className="mb-4 text-lg font-semibold leading-6 text-surface-900"
                >
                  Submit Your Project
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">
                      {error}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-surface-700"
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
                      className="mt-1 input-search"
                      placeholder="Enter project title"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-surface-700"
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
                      className="mt-1 input-search"
                      placeholder="Describe your project"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="githubUrl"
                      className="block text-sm font-medium text-surface-700"
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
                      className="mt-1 input-search"
                      placeholder="https://github.com/username/repo"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="liveUrl"
                      className="block text-sm font-medium text-surface-700"
                    >
                      Live URL
                    </label>
                    <input
                      type="url"
                      id="liveUrl"
                      name="liveUrl"
                      value={formData.liveUrl}
                      onChange={handleInputChange}
                      className="mt-1 input-search"
                      placeholder="https://your-project.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="technologies"
                      className="block text-sm font-medium text-surface-700"
                    >
                      Technologies *
                    </label>
                    <input
                      type="text"
                      id="technologies"
                      name="technologies"
                      required
                      value={formData.technologies.join(", ")}
                      onChange={handleTechnologiesChange}
                      className="mt-1 input-search"
                      placeholder="React, Node.js, MongoDB (comma-separated)"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-surface-700">
                      Collaborators
                    </label>
                    {formData.collaborators.map((collaborator, index) => (
                      <div key={index} className="flex gap-2 mb-2">
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
                          placeholder="Name"
                          className="flex-1 input-search"
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
                          className="flex-1 input-search"
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
                          placeholder="Role"
                          className="flex-1 input-search"
                        />
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeCollaborator(index)}
                            className="text-red-500 btn-icon hover:bg-red-50"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addCollaborator}
                      className="mt-2 btn btn-secondary"
                    >
                      Add Collaborator
                    </button>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Project"}
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
