import Contact from "../models/Contact.js";
import User from "../models/User.js";

const addContact = async (ownerId, contactId) => {
  if (ownerId === contactId) throw new Error("Cannot add yourself");

  const contactUser = await User.findById(contactId);
  if (!contactUser) throw new Error("Contact not found");

  const contact = await Contact.create({ owner: ownerId, contact: contactId });
  return contact;
};

const listContacts = async (ownerId) => {
  return Contact.find({ owner: ownerId }).populate("contact", "username email");
};

const removeContact = async (ownerId, contactId) => {
  return Contact.findByIdAndDelete({
    owner: ownerId,
    contact: contactId,
  });
};

export default { addContact, listContacts, removeContact };
