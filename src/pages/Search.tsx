import React from "react";
import MovieCard from "../components/MovieCard";
import AdSensePlaceholder from "../components/AdSensePlaceholder";
import { Movie } from "../types";
import { Search as SearchIcon } from "lucide-react";

interface SearchProps {
  query: string;
  movies: Movie[];
  onPlay: (movie: Movie) => void;
  onToggleFavorite: (movie: Movie) => void;
  favorites: string[];
}

export default function Search({ query, movies, onPlay, onToggleFavorite, favorites }: SearchProps) {
  
  // Real-time keyword filter across titles, categories, sub-categories, languages and descriptions (deduplicated)
  const rawFiltered = movies.filter(
    (movie) =>
      movie.title.toLowerCase().includes(query.toLowerCase()) ||
      movie.category.toLowerCase().includes(query.toLowerCase()) ||
      (movie.subCategory && movie.subCategory.toLowerCase().includes(query.toLowerCase())) ||
      (movie.language && movie.language.toLowerCase().includes(query.toLowerCase())) ||
      movie.description.toLowerCase().includes(query.toLowerCase())
  );

  const filteredMovies = Array.from(
    new Map(rawFiltered.map((m) => [m.id, m])).values()
  );

  return (
    <div className="bg-neutral-950 min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 select-none">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Search Header */}
        <div className="border-b border-neutral-900 pb-5">
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <SearchIcon className="text-red-600 h-5 w-5" />
            {query ? (
              <span>
                Search results for: <strong className="text-red-500">"{query}"</strong>
              </span>
            ) : (
              <span>Explore Stream Catalog</span>
            )}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Found {filteredMovies.length} matching entries in Cloud Firestore.
          </p>
        </div>

        {/* Results grid layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredMovies.map((movie) => (
            <div key={movie.id} className="flex justify-center">
              <MovieCard
                movie={movie}
                onPlay={onPlay}
                onToggleFavorite={onToggleFavorite}
                isFavorite={favorites.includes(movie.id)}
              />
            </div>
          ))}
        </div>

        {filteredMovies.length === 0 && (
          <div className="text-center py-20 bg-neutral-950 rounded-lg border border-neutral-900/60 max-w-xl mx-auto">
            <SearchIcon size={40} className="text-neutral-700 mx-auto mb-4" />
            <h4 className="text-sm font-bold text-neutral-300">No Streaming Matches Found</h4>
            <p className="text-xs text-neutral-600 max-w-xs mx-auto mt-1 leading-relaxed">
              We couldn't locate any movies, animations or trailers matching that specific phrase. Try other categories like Action, Sci-Fi, or Comedy.
            </p>
          </div>
        )}

        {/* Banner Ad Placement */}
        <div className="pt-8">
          <AdSensePlaceholder type="banner" />
        </div>

      </div>
    </div>
  );
}
