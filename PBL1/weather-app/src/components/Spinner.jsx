const Spinner = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 backdrop-blur-md">
      <div className="relative">
        <div className="h-24 w-24 rounded-full border-t-8 border-b-8 border-gray-200" />
        <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-t-8 border-b-8 border-orange-500 animate-spin" />
      </div>
    </div>
  );
};

export default Spinner;
