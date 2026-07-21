import React, { useRef, useState, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  Gauge,
  Tv,
  ArrowLeft,
  ChevronRight,
  Heart,
  Share2,
  AlertCircle
} from "lucide-react";
import { Movie } from "../types";

interface VideoPlayerProps {
  movie: Movie;
  onBack: () => void;
  onNextRecommended?: (movie: Movie) => void;
  recommendedMovies?: Movie[];
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function VideoPlayer({
  movie,
  onBack,
  onNextRecommended,
  recommendedMovies = [],
  isFavorite = false,
  onToggleFavorite
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  // Auto-hide controls when mouse is inactive
  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleMouseMove = () => {
      setControlsVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (isPlaying) {
          setControlsVisible(false);
        }
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
      }
      clearTimeout(timer);
    };
  }, [isPlaying]);

  // Handle keyboard hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          toggleMute();
          break;
        case "arrowleft":
          e.preventDefault();
          skip(-10);
          break;
        case "arrowright":
          e.preventDefault();
          skip(10);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isMuted]);

  // Reset states when movie changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasError(false);
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [movie]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setHasError(true);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMute = !isMuted;
    setIsMuted(newMute);
    videoRef.current.muted = newMute;
    if (!newMute && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error attempting to enable full-screen mode:", err);
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Keep state sync with fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleVideoError = () => {
    setHasError(true);
  };

  return (
    <div className={`w-full ${isTheaterMode ? "max-w-full" : "max-w-5xl mx-auto"} flex flex-col gap-6`}>
      {/* Top action header */}
      <div className="flex items-center justify-between px-2 select-none">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-semibold py-1.5 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Browse</span>
        </button>

        <div className="flex items-center gap-4 text-xs">
          {onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded border transition-colors cursor-pointer ${
                isFavorite
                  ? "bg-red-600/10 border-red-500/30 text-red-500"
                  : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              <Heart size={13} className={isFavorite ? "fill-red-500" : ""} />
              <span>{isFavorite ? "In My List" : "Add to My List"}</span>
            </button>
          )}

          <button
            onClick={() => setIsTheaterMode(!isTheaterMode)}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded border transition-colors cursor-pointer ${
              isTheaterMode
                ? "bg-red-600/10 border-red-500/30 text-red-500"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            <Tv size={13} />
            <span>{isTheaterMode ? "Normal Mode" : "Theater Mode"}</span>
          </button>
        </div>
      </div>

      {/* Main player box container */}
      <div
        ref={containerRef}
        className={`relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl group border border-neutral-900 ${
          isFullscreen ? "rounded-none border-0 h-screen aspect-auto" : ""
        }`}
      >
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 p-6 text-center select-none">
            <AlertCircle size={48} className="text-red-500 mb-4 animate-bounce" />
            <h4 className="text-lg font-bold text-neutral-200">Unable to Stream Video</h4>
            <p className="text-xs text-neutral-500 max-w-md mt-1 leading-relaxed">
              We encountered a streaming latency block or an invalid video URL pattern. Ensure the source link supports CORS.
            </p>
            <button
              onClick={() => {
                setHasError(false);
                if (videoRef.current) videoRef.current.load();
              }}
              className="mt-4 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded transition-all"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={movie.videoUrl}
              poster={movie.thumbnail}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleVideoError}
              className="w-full h-full object-contain"
              onContextMenu={(e) => e.preventDefault()}
              onClick={togglePlay}
              preload="auto"
              playsInline
            />

            {/* Quick Play/Pause Center Indicator Splash on Click */}
            <div
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
            >
              {!isPlaying && (
                <div className="p-5 rounded-full bg-black/60 border border-neutral-800 text-white/90 scale-100 hover:scale-110 active:scale-95 transition-all shadow-xl">
                  <Play size={28} className="fill-white" />
                </div>
              )}
            </div>

            {/* Controls overlay */}
            <div
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 flex flex-col gap-3 transition-opacity duration-300 z-40 select-none ${
                controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              {/* Timeline Slider */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-neutral-400 select-none">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-600 focus:outline-none"
                />
                <span className="text-[11px] font-mono text-neutral-400 select-none">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Lower Controls Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 sm:gap-5">
                  {/* Play / Pause toggle */}
                  <button
                    onClick={togglePlay}
                    className="text-white hover:text-red-500 transition-colors"
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} className="fill-white" />}
                  </button>

                  {/* Skip Buttons */}
                  <button
                    onClick={() => skip(-10)}
                    className="text-neutral-400 hover:text-white transition-colors"
                    title="Rewind 10s"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={() => skip(10)}
                    className="text-neutral-400 hover:text-white transition-colors"
                    title="Forward 10s"
                  >
                    <RotateCw size={16} />
                  </button>

                  {/* Volume Controls */}
                  <div className="flex items-center gap-2 group/volume">
                    <button
                      onClick={toggleMute}
                      className="text-neutral-400 hover:text-white transition-colors"
                    >
                      {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-600 focus:outline-none hidden sm:inline-block"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Playback speed options dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                      className="flex items-center gap-1 text-xs text-neutral-300 hover:text-white font-semibold cursor-pointer"
                    >
                      <Gauge size={14} />
                      <span>{playbackRate}x</span>
                    </button>

                    {showSpeedMenu && (
                      <div className="absolute bottom-8 right-0 w-24 bg-neutral-950 border border-neutral-800 rounded shadow-2xl py-1 z-50 text-xs">
                        {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => handleSpeedChange(rate)}
                            className={`w-full text-left px-3 py-1.5 hover:bg-neutral-900 transition-colors ${
                              playbackRate === rate ? "text-red-500 font-bold bg-neutral-900" : "text-neutral-400"
                            }`}
                          >
                            {rate === 1 ? "Normal" : `${rate}x`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Maximize / Fullscreen Toggle */}
                  <button
                    onClick={toggleFullscreen}
                    className="text-neutral-400 hover:text-white transition-colors"
                    title="Toggle Fullscreen"
                  >
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Description & Recommendations Section underneath player */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-2 select-none">
        {/* Left Col: Info panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl sm:text-2xl font-black text-white">{movie.title}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 font-bold mt-1">
              <span className="text-green-500">{movie.year}</span>
              <span>•</span>
              <span>{movie.duration}</span>
              <span>•</span>
              <span className="border border-neutral-800 px-1 py-0.2 rounded text-[10px] text-neutral-500 uppercase">
                {movie.rating}
              </span>
              <span>•</span>
              <span className="text-neutral-400 bg-neutral-900 border border-neutral-800/80 px-2 py-0.5 rounded">
                {movie.category}
              </span>
            </div>
          </div>

          <div className="border-t border-neutral-900/60 pt-4">
            <h5 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Movie Narrative</h5>
            <p className="text-sm text-neutral-300 leading-relaxed">{movie.description}</p>
          </div>

          <div className="bg-neutral-950 border border-neutral-900 p-4 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-neutral-400 font-semibold">Self-Hosted Streaming active. Unrestricted bandwidth.</span>
            </div>
            <button className="text-red-500 font-bold hover:underline">Report Lag</button>
          </div>
        </div>

        {/* Right Col: Up Next Sidebar Recommendations */}
        <div className="space-y-4">
          <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest px-1">Up Next (Recommended)</h4>
          <div className="flex flex-col gap-3">
            {recommendedMovies.filter(m => m.id !== movie.id).slice(0, 4).map((recMovie) => (
              <div
                key={recMovie.id}
                onClick={() => onNextRecommended && onNextRecommended(recMovie)}
                className="flex gap-3 bg-neutral-950 hover:bg-neutral-900 p-2 rounded border border-neutral-900 hover:border-neutral-800/80 cursor-pointer transition-all group"
              >
                <div className="relative w-24 aspect-[16/9] bg-neutral-900 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={recMovie.thumbnail}
                    alt={recMovie.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={14} className="fill-white text-white" />
                  </div>
                </div>

                <div className="flex flex-col justify-center min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-white truncate group-hover:text-red-500 transition-colors">
                    {recMovie.title}
                  </h5>
                  <p className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1.5 font-semibold">
                    <span>{recMovie.year}</span>
                    <span>•</span>
                    <span>{recMovie.duration}</span>
                  </p>
                </div>
              </div>
            ))}

            {recommendedMovies.filter(m => m.id !== movie.id).length === 0 && (
              <p className="text-xs text-neutral-600 italic px-2">No recommended titles available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
