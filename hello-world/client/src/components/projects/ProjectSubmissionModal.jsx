import { Fragment, useState, useEffect, useRef } from "react";
import { Dialog, Transition, Combobox } from "@headlessui/react";
import { X, Plus, Search, Check, ChevronDown, Tag } from "lucide-react";
import { authApi, projectsApi } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";

export default function ProjectSubmissionModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    githubUrl: "",
    liveUrl: "",
    technologies: [],
    screenshots: [],
    collaborators: [],
  });

  console.log("[ProjectSubmissionModal.jsx--[19]], formData", formData);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [techInput, setTechInput] = useState("");
  const [isCollaboratorInputFocused, setIsCollaboratorInputFocused] =
    useState(false);

  const [dropdownPosition, setDropdownPosition] = useState("bottom");
  const comboboxRef = useRef(null);
  const dialogRef = useRef(null);

  // Fetch available users for collaborator selection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await authApi.getUsers();
        // Filter out users with 'guest' role and current user
        const eligibleUsers = response.data.users.filter(
          (u) => u.role !== "guest" && u.id !== user.id
        );
        setUsers(eligibleUsers);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    fetchUsers();
  }, [user.id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTechInputKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tech = techInput.trim();
      if (tech && !formData.technologies.includes(tech)) {
        setFormData((prev) => ({
          ...prev,
          technologies: [...prev.technologies, tech],
        }));
        setTechInput("");
      }
    }
  };

  const removeTechnology = (techToRemove) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((tech) => tech !== techToRemove),
    }));
  };

  const handleCollaboratorChange = (selectedUsers) => {
    setFormData((prev) => ({
      ...prev,
      collaborators: selectedUsers,
    }));
  };

  const filteredUsers =
    searchQuery === ""
      ? users.filter(
          (user) => !formData.collaborators.some((c) => c.id === user.id)
        )
      : users.filter(
          (user) =>
            !formData.collaborators.some((c) => c.id === user.id) &&
            (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              user.email.toLowerCase().includes(searchQuery.toLowerCase()))
        );

  // Function to calculate dropdown position
  const updateDropdownPosition = () => {
    if (!comboboxRef.current || !dialogRef.current) return;

    const comboboxRect = comboboxRef.current.getBoundingClientRect();
    const dialogRect = dialogRef.current.getBoundingClientRect();

    // Space below the combobox
    const spaceBelow = dialogRect.bottom - comboboxRect.bottom;
    // Space above the combobox
    const spaceAbove = comboboxRect.top - dialogRect.top;

    // Height of the dropdown (including some padding)
    const dropdownHeight = 300; // Max height of dropdown

    // If space below is less than dropdown height and space above is greater,
    // position dropdown above
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      setDropdownPosition("top");
    } else {
      setDropdownPosition("bottom");
    }
  };

  // Update position when input is focused
  const handleInputFocus = () => {
    setIsCollaboratorInputFocused(true);
    updateDropdownPosition();
  };

  // Add resize listener
  useEffect(() => {
    const handleResize = () => {
      if (isCollaboratorInputFocused) {
        updateDropdownPosition();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isCollaboratorInputFocused]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await projectsApi.create({
        ...formData,
        collaborators: [
          // Add current user as maintainer
          {
            userId: user.id,
            role: "contributor",
          },
          // Add other collaborators as contributors
          ...formData.collaborators.map((collaborator) => ({
            userId: collaborator._id,
            role: "contributor",
          })),
        ],
      });

      onClose();
    } catch (err) {
      console.error("Project creation error:", err.response?.data || err);
      setError(err.response?.data?.message || "Failed to submit project");
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
          <div className="fixed inset-0 backdrop-blur-sm bg-black/25" />
        </Transition.Child>

        <div className="overflow-y-auto fixed inset-0">
          <div className="flex justify-center items-center p-4 min-h-full">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                ref={dialogRef}
                className="overflow-hidden p-8 w-full max-w-2xl bg-white rounded-2xl shadow-xl"
              >
                <div className="flex justify-between items-center mb-8">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500"
                  >
                    Submit Your Project
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 rounded-full transition-all hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="flex gap-2 items-center p-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                      <div className="p-1 bg-red-100 rounded-full">
                        <X className="w-4 h-4" />
                      </div>
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Project Title <span className="text-primary-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-gray-400"
                      placeholder="Enter your project title"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Description <span className="text-primary-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      required
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="mt-1 block w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none placeholder:text-gray-400"
                      placeholder="Describe your project..."
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="githubUrl"
                        className="block text-sm font-medium text-gray-700"
                      >
                        GitHub URL <span className="text-primary-500">*</span>
                      </label>
                      <input
                        type="url"
                        id="githubUrl"
                        name="githubUrl"
                        required
                        value={formData.githubUrl}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-gray-400"
                        placeholder="https://github.com/username/repo"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="liveUrl"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Live Demo URL
                      </label>
                      <input
                        type="url"
                        id="liveUrl"
                        name="liveUrl"
                        value={formData.liveUrl}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-gray-400"
                        placeholder="https://your-project.vercel.app"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Technologies Used{" "}
                      <span className="text-primary-500">*</span>
                    </label>
                    <div className="p-2 mt-1 bg-white rounded-xl border border-gray-300 transition-all focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-sm font-medium bg-primary-50 text-primary-700 border border-primary-100 transition-all group hover:bg-primary-100"
                          >
                            <Tag className="w-3.5 h-3.5 mr-1.5 text-primary-500" />
                            {tech}
                            <button
                              type="button"
                              onClick={() => removeTechnology(tech)}
                              className="ml-1 p-0.5 text-primary-400 rounded-full transition-all hover:text-primary-600 hover:bg-primary-200/50"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2 items-center px-2 py-1">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={techInput}
                          onChange={(e) => setTechInput(e.target.value)}
                          onKeyDown={handleTechInputKeyDown}
                          className="flex-1 text-sm bg-transparent border-0 focus:ring-0 placeholder:text-gray-400"
                          placeholder="Type a technology and press Enter (e.g., React)"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Team Collaborators
                    </label>
                    <Combobox
                      value={formData.collaborators}
                      onChange={handleCollaboratorChange}
                      multiple
                    >
                      <div className="relative" ref={comboboxRef}>
                        <div className="p-3 bg-white rounded-xl border border-gray-300 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {formData.collaborators.map((user) => (
                              <span
                                key={user.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm transition-all group hover:border-gray-300 hover:bg-gray-50"
                              >
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="object-cover w-5 h-5 rounded-full ring-2 ring-white"
                                  />
                                ) : (
                                  <div className="flex justify-center items-center w-5 h-5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full ring-2 ring-white">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                {user.name}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCollaboratorChange(
                                      formData.collaborators.filter(
                                        (u) => u.id !== user.id
                                      )
                                    )
                                  }
                                  className="ml-0.5 p-0.5 text-gray-400 rounded-full transition-all hover:text-gray-600 hover:bg-gray-100"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex relative gap-2 items-center">
                            <div className="flex flex-1 items-center min-w-0 group">
                              <Search className="w-4 h-4 text-gray-400 transition-colors group-focus-within:text-primary-500" />
                              <Combobox.Input
                                className="px-2 py-1 w-full text-sm text-gray-900 bg-transparent border-0 focus:ring-0 placeholder:text-gray-400"
                                placeholder="Search for collaborators..."
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={handleInputFocus}
                                onBlur={() => {
                                  setTimeout(() => {
                                    setIsCollaboratorInputFocused(false);
                                  }, 200);
                                }}
                                displayValue={() => ""}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setIsCollaboratorInputFocused(true)
                              }
                              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-all"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <Transition
                          show={
                            isCollaboratorInputFocused || searchQuery !== ""
                          }
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                          afterLeave={() => setSearchQuery("")}
                        >
                          <Combobox.Options
                            static
                            className={`
                              absolute z-10 w-full max-h-[300px] bg-white rounded-xl border border-gray-200 shadow-lg focus:outline-none overflow-auto divide-y divide-gray-100
                              ${
                                dropdownPosition === "top"
                                  ? "bottom-full mb-2"
                                  : "top-full mt-2"
                              }
                            `}
                          >
                            {filteredUsers.length === 0 ? (
                              <div className="px-4 py-10 text-sm text-center">
                                <div className="flex justify-center mb-3">
                                  <div className="p-2 text-gray-400 bg-gray-50 rounded-full">
                                    <Search className="w-5 h-5" />
                                  </div>
                                </div>
                                <p className="font-medium text-gray-500">
                                  {searchQuery !== ""
                                    ? "No collaborators found"
                                    : "No available collaborators"}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                  {searchQuery !== ""
                                    ? "Try searching with a different term"
                                    : "All potential collaborators are already added"}
                                </p>
                              </div>
                            ) : (
                              <div className="py-1">
                                {filteredUsers.map((user) => (
                                  <Combobox.Option
                                    key={user.id}
                                    className={({ active }) =>
                                      `relative cursor-pointer select-none py-3 px-4 ${
                                        active ? "bg-gray-50" : ""
                                      }`
                                    }
                                    value={user}
                                  >
                                    {({ selected }) => (
                                      <div className="flex justify-between items-center group">
                                        <div className="flex gap-3 items-center min-w-0">
                                          <div className="flex-shrink-0">
                                            {user.avatar ? (
                                              <img
                                                src={user.avatar}
                                                alt={user.name}
                                                className="object-cover w-9 h-9 rounded-full ring-2 ring-white"
                                              />
                                            ) : (
                                              <div className="flex justify-center items-center w-9 h-9 text-gray-600 bg-gray-100 rounded-full ring-2 ring-white">
                                                {user.name
                                                  .charAt(0)
                                                  .toUpperCase()}
                                              </div>
                                            )}
                                          </div>
                                          <div className="truncate">
                                            <p className="text-sm font-medium text-gray-900 truncate transition-colors group-hover:text-primary-600">
                                              {user.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                              {user.role
                                                .charAt(0)
                                                .toUpperCase() +
                                                user.role.slice(1)}
                                            </p>
                                          </div>
                                        </div>
                                        <div
                                          className={`flex items-center gap-2 ${
                                            selected
                                              ? "opacity-100"
                                              : "opacity-0 group-hover:opacity-100"
                                          } transition-opacity`}
                                        >
                                          {selected ? (
                                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-primary-700 bg-primary-50">
                                              Selected
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md">
                                              Click to select
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </Combobox.Option>
                                ))}
                              </div>
                            )}
                          </Combobox.Options>
                        </Transition>
                      </div>
                    </Combobox>
                  </div>

                  <div className="flex gap-4 justify-end pt-6 mt-8 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-400 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isSubmitting ? (
                        <div className="flex gap-2 items-center">
                          <div className="w-4 h-4 rounded-full border-2 border-white animate-spin border-t-transparent"></div>
                          <span>Submitting...</span>
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
