import { useState, useRef, useEffect, useCallback } from "react";
import type { KeyboardEvent } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export interface OrgResult {
  id: number;
  customerCode: string;
  name: string;
  address: string | null;
}

interface Props {
  value: string;
  onChange: (name: string) => void;
  onSelect: (org: OrgResult) => void;
  onClear: () => void;
  onBlur?: () => void;
  className?: string;
  id?: string;
}

export function OrganisationAutocomplete({
  value,
  onChange,
  onSelect,
  onClear,
  onBlur,
  className,
  id,
}: Props) {
  const [results, setResults] = useState<OrgResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const fetchResults = useCallback(async (query: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    try {
      const url = `${API_BASE}/api/leads/organizations/search?q=${encodeURIComponent(query)}`.replace(
        /([^:]\/)\/+/g,
        "$1",
      );
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        setResults([]);
        return;
      }
      const data: OrgResult[] = await res.json();
      setResults(data);
      setIsOpen(data.length > 0);
      setActiveIndex(-1);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (text: string) => {
    onChange(text);

    if (selectedId !== null) {
      setSelectedId(null);
      onClear();
    }

    clearTimeout(debounceRef.current);
    if (text.trim().length >= 3) {
      debounceRef.current = setTimeout(() => fetchResults(text.trim()), 300);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (org: OrgResult) => {
    setSelectedId(org.id);
    setIsOpen(false);
    setResults([]);
    onSelect(org);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="org-autocomplete-wrapper" ref={wrapperRef}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        onFocus={() => {
          if (results.length > 0 && !selectedId) setIsOpen(true);
        }}
        className={className}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls="org-autocomplete-list"
      />
      {isLoading && <span className="org-autocomplete-loading" aria-hidden />}
      {isOpen && results.length > 0 && (
        <ul
          id="org-autocomplete-list"
          className="org-autocomplete-dropdown"
          role="listbox"
        >
          {results.map((org, i) => (
            <li
              key={org.id}
              role="option"
              aria-selected={i === activeIndex}
              className={`org-autocomplete-item${i === activeIndex ? " active" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(org);
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="org-autocomplete-name">{org.name}</span>
              {org.address && (
                <span className="org-autocomplete-address">{org.address}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
