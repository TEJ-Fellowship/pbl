const PostForm = ({ categories, handleSetShowPostForm }) => (
  <div className="bg-background rounded-2xl shadow-sm border border-border p-4 mb-4">
    <h3 className="font-semibold text-text-dark mb-3">
      Request Help from Your Community
    </h3>
    <div className="space-y-3">
      <input
        type="text"
        placeholder="What do you need help with?"
        className="w-full p-3 border border-border-strong rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
      <textarea
        placeholder="Describe your request in detail..."
        rows="3"
        className="w-full p-3 border border-border-strong rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
      />
      <div className="flex space-x-3">
        <select className="flex-1 p-3 border border-border-strong rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
          <option>Select Category</option>
          {categories
            .filter((c) => c.id !== "all")
            .map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
        </select>
        <select className="flex-1 p-3 border border-border-strong rounded-xl focus:outline-none focus:ring-2 focus:ring-primary">
          <option>Priority Level</option>
          <option value="low">Low - No rush</option>
          <option value="medium">Medium - Soon</option>
          <option value="high">High - Urgent</option>
        </select>
      </div>
      <div className="flex justify-between">
        <button
          onClick={() => handleSetShowPostForm(false)}
          className="px-6 py-2 text-text-light hover:text-text-dark transition-colors"
        >
          Cancel
        </button>
        <button className="bg-gradient-to-r from-primary-light to-primary text-background px-6 py-2 rounded-full font-medium hover:from-primary hover:to-primary-dark transition-colors">
          Post Request
        </button>
      </div>
    </div>
  </div>
);

export default PostForm;
