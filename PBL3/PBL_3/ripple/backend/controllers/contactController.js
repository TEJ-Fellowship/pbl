import contactService from "../services/contactService.js";

const addContact = async (req, res) => {
  try {
    const contact = await contactService.addContact(
      req.user.userId, // req.user already set in JWT
      req.body.contactId
    );
    res.json({ message: "Contact added", contact });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const listContacts = async (req, res) => {
  try {
    const contacts = await contactService.listContacts(req.user.userId);
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const removeContact = async (req, res) => {
  try {
    const contact = await contactService.removeContact(
      req.user.userId,
      req.params.contactId
    );

    res.json({ message: "Contact removed", contact });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default { addContact, listContacts, removeContact };
