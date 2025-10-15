import { BookOpen, Search } from "lucide-react";
import "./SearchIndicator.css";

const SearchIndicator = () => {
  return (
    <div className="flex items-center search-indicator">
      <div className="search-icon-container">
        <BookOpen className="h-5 w-5 text-gray-600 book-icon" />
        <div className="data-dot-1 data-dots"></div>
        <div className="data-dot-2 data-dots"></div>
        <div className="data-dot-3 data-dots"></div>
        <div className="data-dot-4 data-dots"></div>
        <div className="search-orbit">
          <Search className="h-4 w-4 text-blue-500" />
        </div>
      </div>
      <span className="searching-message text-md ml-2">
        Checking sources
        <span className="dots-container">
          <span className="typing-dots"></span>
        </span>
      </span>
    </div>
  );
};

export default SearchIndicator;
