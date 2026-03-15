// Helper function to format user data for JWT token
const formatUserData = (user) => {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
  };
};

module.exports = { formatUserData };
