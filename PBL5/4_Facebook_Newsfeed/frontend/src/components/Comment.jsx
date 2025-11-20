const Comment = ({ comment }) => {
  return (
    <div className="flex items-start space-x-2 py-2">
      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-semibold">
          {comment.commenter?.username?.[0]?.toUpperCase() || 'U'}
        </span>
      </div>
      <div className="flex-1 bg-gray-100 rounded-lg px-3 py-2">
        <div className="flex items-baseline space-x-2">
          <span className="font-semibold text-gray-900 text-sm">
            {comment.commenter?.username || 'Unknown'}
          </span>
        </div>
        <p className="text-gray-800 text-sm mt-1">{comment.content}</p>
      </div>
    </div>
  );
};

export default Comment;

