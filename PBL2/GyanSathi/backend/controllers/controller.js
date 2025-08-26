import { Note } from "../models/Note.js";

export const getAllNote = async (req, res) => {
  try {
    const notes = await Note.find();
    res.status(200).json(notes);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error!");
  }
};

export const createPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    const newNote = new Note({ title, content });

    await newNote.save();
    res
      .status(201)
      .json({ message: "new note has been created successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error!");
  }
};

export const updatePost = async (req, res) => {
  try {
    const { title, content } = req.body;
    await Note.findByIdAndUpdate(req.params.id, {
      title,
      content,
    });
    res.status(200).json({ message: "Note has been successfully updated!" });
  } catch (error) {
    console.log("Some error during UPDATE!", error);
  }
};

export const deletePost = async (req, res) => {
  try {
    await Note.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Note successfully deleted!" });
  } catch (error) {
    console.log("Some error during DELETE", error);
  }
};
