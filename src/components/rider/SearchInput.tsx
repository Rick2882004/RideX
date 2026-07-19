"use client";

import { useEffect, useState } from "react";

type Props = {
  placeholder: string;
  icon: React.ReactNode;
  onSelect: (location: {
    lat: number;
    lng: number;
    name: string;
  }) => void;
};

export default function SearchInput({
  placeholder,
  icon,
  onSelect,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
      <div className="flex items-center rounded-2xl bg-[#1b1b1b] px-5 py-5">
        <div className="mr-4">{icon}</div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-white outline-none"
        />
      </div>

      {loading && (
        <div className="absolute z-50 mt-2 rounded-xl bg-[#222] p-3 text-white">
          Searching...
        </div>
      )}

      {results.length > 0 && (
        <div className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#1b1b1b]">
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
              className="w-full border-b border-white/5 p-4 text-left text-white transition hover:bg-[#292929]"
            >
              {item.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}