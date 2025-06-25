const PostForm = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
    <h3 className="font-semibold text-gray-900 mb-3">
      Request Help from Your Community
    </h3>
    <div className="space-y-3">
      <input
        type="text"
        placeholder="What do you need help with?"
        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
      <textarea
        placeholder="Describe your request in detail..."
        rows="3"
        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
      />
      <div className="flex space-x-3">
        <select className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500">
          <option>Select Category</option>
          {categories
            .filter((c) => c.id !== "all")
            .map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
        </select>
        <select className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500">
          <option>Priority Level</option>
          <option value="low">Low - No rush</option>
          <option value="medium">Medium - Soon</option>
          <option value="high">High - Urgent</option>
        </select>
      </div>
      <div className="flex justify-between">
        <button
          onClick={() => setShowPostForm(false)}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Cancel
        </button>
        <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-full font-medium hover:from-green-600 hover:to-green-700 transition-colors">
          Post Request
        </button>
      </div>
    </div>
  </div>
);

export default PostForm;
