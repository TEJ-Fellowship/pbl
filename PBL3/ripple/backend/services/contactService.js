import Contact from "../models/Contact.js";
import User from "../models/User.js";

const getFriends = async (userId) => {
  const contacts = await Contact.find({
    $or: [{ owner: userId }, { contact: userId }],
  }).populate("owner contact", "username _id");

  const friends = contacts.map((c) => {
    if (c.owner._id.toString() === userId.toString()) {
      return c.contact; // friend is the contact
    } else {
      return c.owner; // friend is the owner
    }
  });

  return friends;
};

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

export default { getFriends, addContact, listContacts, removeContact };
