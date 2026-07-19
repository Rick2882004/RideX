"use client";

import { useEffect, useState } from "react";

type Props = {
  placeholder: string;
  icon: React.ReactNode;
  value?: string;
  onSelect: (location: {
    lat: number;
    lng: number;
    name: string;
  }) => void;
};

export default function SearchInput({
  placeholder,
  icon,
  value,
  onSelect,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Sync with value prop if updated by parent (shortcuts, active ride)
  useEffect(() => {
    if (value !== undefined) {
      setQuery(value || "");
    }
  }, [value]);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);

      const res = await fetch(
        `/api/search-location?q=${encodeURIComponent(query)}`
      );

      const data = await res.json();

      setResults(data);
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative mb-5">
      <div className="flex items-center rounded-2xl bg-white/5 border border-white/5 px-5 py-4">
        <div className="mr-4">{icon}</div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-white outline-none placeholder-gray-500 text-sm"
        />
      </div>

      {loading && (
        <div className="absolute z-50 mt-2 rounded-xl bg-[#222] border border-white/10 p-3 text-white text-xs">
          Searching...
        </div>
      )}

      {results.length > 0 && (
        <div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#1b1b1b] shadow-2xl">
          {results.map((item: any) => (
            <button
              key={item.place_id}
              onClick={() => {
                setQuery(item.display_name);
                setResults([]);

                onSelect({
                  lat: Number(item.lat),
                  lng: Number(item.lon),
                  name: item.display_name,
                });
              }}
              className="w-full border-b border-white/5 p-4 text-left text-white text-xs transition hover:bg-[#292929] cursor-pointer"
            >
              {item.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}