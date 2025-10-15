import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Language {
  value: string;
  label: string;
}

interface LanguageDropdownProps {
  options: Language[];
  value: string;
  onChange: (value: string) => void;
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({ options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((opt) => opt.value === value);

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (option: Language) => {
    onChange(option.value);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center justify-between w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        onClick={() => setIsOpen(!isOpen)}
        style={{ height: "48px" }}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : "Select a language"}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full bottom-full mb-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <ul className="py-1 overflow-auto max-h-48">
            {options.map((option) => (
              <li
                key={option.value}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                  option.value === value ? "font-semibold bg-gray-50" : ""
                }`}
                onClick={() => handleSelect(option)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LanguageDropdown;
