import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Modal } from "./ui/modal";
import { Search, X } from "lucide-react";
import axios from "axios";

// Initial program state
const initialProgramState = {
    title: "",
    description: "",
    start: "",
    end: "",
    image: "",
    location: "",
    category: "",
    organizer: "",
    contact: "",
    volunteersNeeded: 0,
    tags: [],
    status: "",
    resources: ""
};

function Programs() {
    const [programs, setPrograms] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedProgram, setSelectedProgram] = useState(null);

    // Form state
    const [newProgram, setNewProgram] = useState(initialProgramState);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    // Tag input state
    const [tagInput, setTagInput] = useState("");

    // Admin flag
    const isAdmin = true;

    // Add modal state
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Fetch programs from backend
    useEffect(() => {
        fetchPrograms();
    }, []);

    const fetchPrograms = async () => {
        try {
            const response = await axios.get("http://localhost:3000/api/programs");
            setPrograms(response.data);
        } catch (err) {
            console.log("Error fetching programs:", err);
        }
    };

    // Filter programs by search
    const filteredPrograms = programs.filter((program) =>
        program.title.toLowerCase().includes(search.toLowerCase())
    );

    // Handle image selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImageFile(file);
        if (file) setImagePreview(URL.createObjectURL(file));
    };

    // Handle tag input enter
    const handleTagKeyDown = (e) => {
        if (e.key === "Enter" && tagInput.trim()) {
            e.preventDefault();
            if (!newProgram.tags.includes(tagInput.trim())) {
                setNewProgram({ ...newProgram, tags: [...newProgram.tags, tagInput.trim()] });
            }
            setTagInput("");
        }
    };

    // Remove tag
    const removeTag = (tagToRemove) => {
        setNewProgram({
            ...newProgram,
            tags: newProgram.tags.filter((t) => t !== tagToRemove)
        });
    };

    const handleTaskToggle = async (taskId, completed) => {
        try {
            await axios.patch(`http://localhost:3000/api/tasks/${taskId}`, { completed });
            // Update the programs state to reflect the change without refetching everything
            setPrograms((prevPrograms) =>
                prevPrograms.map((program) => ({
                    ...program,
                    tasks: program.tasks.map((task) =>
                        task._id === taskId ? { ...task, completed } : task
                    ),
                }))
            );
        } catch (err) {
            console.log("Error updating task:", err);
        }
    };


    // Handle new program submit
    const handleAddProgram = async (e) => {
        e.preventDefault();
        if (!newProgram.title || !newProgram.description || !newProgram.start || !newProgram.end) {
            alert("Please fill all required fields");
            return;
        }

        const formData = new FormData();
        Object.keys(newProgram).forEach((key) => {
            if (key === "tags") {
                newProgram.tags.forEach(tag => formData.append("tags", tag));
            } else {
                formData.append(key, newProgram[key]);
            }
        });

        if (imageFile) formData.append("image", imageFile);

        try {
            await axios.post("http://localhost:3000/api/programs", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            fetchPrograms(); // re-render programs with new image
            setNewProgram(initialProgramState);
            setImageFile(null);
            setImagePreview("");
            setTagInput("");
            setIsAddOpen(false);
        } catch (err) {
            console.log("Error adding program:", err);
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex gap-[750px] items-center mb-4">
                <h1 className="text-2xl font-bold">Programs</h1>
                {isAdmin && (
                    <Button onClick={() => setIsAddOpen(true)} className="w-36">+ Add Program</Button>
                )}
            </div>

            {/* Search bar */}
            <div className="flex items-center mb-6 border rounded-lg px-3 py-2 w-full max-w-md">
                <Search className="w-5 h-5 text-gray-500 mr-2" />
                <input
                    type="text"
                    placeholder="Search programs..."
                    className="outline-none w-full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Programs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPrograms.length > 0 ? (
                    filteredPrograms.map((program) => (
                        <Card key={program._id} className="hover:shadow-lg transition">
                            <img
                                src={program.image ? `http://localhost:3000${program.image}` : "/default-placeholder.png"}
                                alt={program.title}
                                className="w-full h-40 object-cover"
                            />
                            <CardHeader>
                                <CardTitle>{program.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 mb-2">{program.description}</p>
                                <p className="text-sm text-gray-500">
                                    <strong>Start:</strong> {program.start.split('T')[0]}
                                </p>
                                <p className="text-sm text-gray-500">
                                    <strong>End:</strong> {program.end.split('T')[0]}
                                </p>

                                {/* Render tasks */}
                                {program.tasks && program.tasks.length > 0 && (
                                    <div className="mt-2">
                                        <h4 className="text-sm font-semibold">Tasks:</h4>
                                        <ul className="list-disc list-inside text-sm text-gray-700">
                                            {program.tasks.map((task) => (
                                                <li key={task._id}>
                                                    {task.taskName} {task.completed ? "(✔️)" : "(❌)"}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <Button className="mt-3" onClick={() => setSelectedProgram(program)}>
                                    View Details
                                </Button>
                            </CardContent>

                        </Card>
                    ))
                ) : (
                    <p className="text-gray-500">No programs found.</p>
                )}
            </div>

            {/* Program Details Modal */}
            <Modal
                isOpen={!!selectedProgram}
                onClose={() => setSelectedProgram(null)}
                title={selectedProgram?.title}
            >
                {selectedProgram && (
                    <div className="space-y-3">
                        <img
                            src={selectedProgram.image ? `http://localhost:3000${selectedProgram.image}` : "/default-placeholder.png"}
                            alt={selectedProgram.title}
                            className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                        <p className="text-gray-700 mb-3">{selectedProgram.description}</p>
                        <p className="text-sm text-gray-600"><strong>📍 Location:</strong> {selectedProgram.location}</p>
                        <p className="text-sm text-gray-600"><strong>📂 Category:</strong> {selectedProgram.category}</p>
                        <p className="text-sm text-gray-600"><strong>👤 Organizer:</strong> {selectedProgram.organizer}</p>
                        <p className="text-sm text-gray-600"><strong>📞 Contact:</strong> {selectedProgram.contact}</p>
                        <p className="text-sm text-gray-600"><strong>👥 Volunteers Needed:</strong> {selectedProgram.volunteersNeeded}</p>
                        <p className="text-sm text-gray-600"><strong>🗓 Start:</strong> {selectedProgram.start.split('T')[0]}</p>
                        <p className="text-sm text-gray-600"><strong>🗓 End:</strong> {selectedProgram.end.split('T')[0]}</p>
                        <p className="text-sm text-gray-600"><strong>📌 Status:</strong> {selectedProgram.status}</p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                            {selectedProgram.tags.map((tag, i) => (
                                <span key={i} className="bg-gray-200 px-2 py-1 text-xs rounded-full">#{tag}</span>
                            ))}
                        </div>

                        {/* External Resource Link */}
                        {selectedProgram.resources && (
                            <a
                                href={selectedProgram.resources}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block mt-4 text-blue-600 hover:underline"
                            >
                                Register / Learn More
                            </a>
                        )}
                        {/* Tasks */}
                        {selectedProgram.tasks && selectedProgram.tasks.length > 0 && (
                            <div className="mt-4">
                                <h4 className="text-sm font-semibold mb-1">Tasks:</h4>
                                <ul className="list-disc list-inside text-sm text-gray-700">
                                    {selectedProgram.tasks.map((task) => (
                                        <li key={task._id} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                onChange={(e) => handleTaskToggle(task._id, e.target.checked)}
                                                className="w-4 h-4"
                                            />
                                            <span className={task.completed ? "line-through text-gray-400" : ""}>
                                                {task.taskName}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Add Program Modal */}
            <Modal
                isOpen={isAddOpen}
                onClose={() => setIsAddOpen(false)}
                title="Add New Program"
            >
                <div className="space-y-3">
                    <input
                        type="text"
                        placeholder="Title"
                        className="border rounded w-full px-3 py-2"
                        value={newProgram.title}
                        onChange={(e) => setNewProgram({ ...newProgram, title: e.target.value })}
                    />
                    <textarea
                        placeholder="Description"
                        className="border rounded w-full px-3 py-2"
                        value={newProgram.description}
                        onChange={(e) => setNewProgram({ ...newProgram, description: e.target.value })}
                    />
                    <input
                        type="date"
                        className="border rounded w-full px-3 py-2"
                        value={newProgram.start}
                        onChange={(e) => setNewProgram({ ...newProgram, start: e.target.value })}
                    />
                    <input
                        type="date"
                        className="border rounded w-full px-3 py-2"
                        value={newProgram.end}
                        onChange={(e) => setNewProgram({ ...newProgram, end: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Location"
                        className="border rounded w-full px-3 py-2"
                        value={newProgram.location}
                        onChange={(e) => setNewProgram({ ...newProgram, location: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Category"
                        className="border rounded w-full px-3 py-2"
                        value={newProgram.category}
                        onChange={(e) => setNewProgram({ ...newProgram, category: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Organizer"
                        className="border rounded w-full px-3 py-2"
                        value={newProgram.organizer}
                        onChange={(e) => setNewProgram({ ...newProgram, organizer: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Contact"
                        className="border rounded w-full px-3 py-2"
                        value={newProgram.contact}
                        onChange={(e) => setNewProgram({ ...newProgram, contact: e.target.value })}
                    />
                    <input
                        type="number"
                        placeholder="Volunteers Needed"
                        className="border rounded w-full px-3 py-2"
                        value={newProgram.volunteersNeeded}
                        onChange={(e) => setNewProgram({ ...newProgram, volunteersNeeded: e.target.value })}
                    />

                    {/* Tags input */}
                    <div className="flex flex-wrap gap-2 mb-2">
                        {newProgram.tags.map((tag, i) => (
                            <span key={i} className="bg-gray-200 px-2 py-1 text-xs rounded-full flex items-center">
                                {tag}
                                <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => removeTag(tag)} />
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        placeholder="Add tag and press Enter"
                        className="border rounded w-full px-3 py-2"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                    />

                    {/* Image upload */}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="border rounded w-full px-3 py-2"
                    />
                    {imagePreview && <img src={imagePreview} className="w-full h-40 object-cover rounded mt-2" alt="Preview" />}

                    <select
                        className="border rounded w-full px-3 py-2"
                        value={newProgram.status}
                        onChange={(e) => setNewProgram({ ...newProgram, status: e.target.value })}
                    >
                        <option value="">Select Status</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                    </select>

                    <input
                        type="text"
                        placeholder="Resource Link"
                        className="border rounded w-full px-3 py-2"
                        value={newProgram.resources}
                        onChange={(e) => setNewProgram({ ...newProgram, resources: e.target.value })}
                    />

                    <Button onClick={handleAddProgram}>Save Program</Button>
                </div>
            </Modal>
        </div>
    );
}

export default Programs;
