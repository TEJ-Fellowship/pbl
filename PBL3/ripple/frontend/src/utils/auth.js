export async function checkAuth() {
  try {
    const response = await fetch('http://localhost:5000/api/auth/check', {
      method: 'GET',
      credentials: 'include', // VERY IMPORTANT to send cookies
    });

    return response.ok;
  } catch (err) {
    console.error("Error checking auth:", err);
    return false;
  }
}
