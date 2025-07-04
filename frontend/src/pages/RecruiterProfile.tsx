// Use the same pattern as the UserProfile component
// But fetch from and save to the recruiter endpoints
const fetchProfile = async () => {
  try {
    // ...
    const response = await axios.get("http://localhost:5000/api/recruiter/profile", {
      // ...
    });
    // ...
  } catch (error) {
    // ...
  }
};

const saveProfile = async () => {
  try {
    // ...
    const response = await axios.put(
      "http://localhost:5000/api/recruiter/profile",
      // ...
    );
    // ...
  } catch (error) {
    // ...
  }
};