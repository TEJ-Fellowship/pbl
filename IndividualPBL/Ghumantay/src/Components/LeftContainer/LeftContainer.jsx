const Leftcontainer = ({ username = "Zeref" }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning";
    else if (hour < 18) return "Good Afternoon";
    else return "Good Evening";
  };

  return (
    <div className="bg-[#17161b] max-w-md mx-auto mt-8 p-6 rounded-lg shadow-md border border-gray-700">
      <h2 className="text-2xl font-bold text-yellow-400">
        {getGreeting()},{" "}
        <span className="text-yellow-400 font-semibold">{username}</span> 👋
      </h2>
    </div>
  );
};

export default Leftcontainer;
