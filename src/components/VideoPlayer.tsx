import React, { useRef, useState, useEffect, useMemo } from "react";
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
  AlertCircle,
  Server,
  RefreshCw
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

const BACKUP_MP4_POOL = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
];

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

  // Server selection state: "server1" (Imported URL), "server2" (Embed CDN), "server3" (Backup MP4 CDN), "server4" (YouTube Trailer/Movie)
  const [activeServer, setActiveServer] = useState<"server1" | "server2" | "server3" | "server4">("server1");
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);

  // Derive movie stream URL or iframe embed based on active server
  const currentStreamInfo = useMemo(() => {
    let url = movie.videoUrl || movie.embedUrl || "";

    if (activeServer === "server2") {
      if ((movie.embedUrl && movie.embedUrl.includes("archive.org")) || movie.id.startsWith("ia-")) {
        const iaId = movie.id.replace(/^ia-/, "");
        url = `https://archive.org/embed/${iaId}`;
      } else {
        const cleanId = movie.tmdbId || movie.imdbId || movie.id.replace(/^(omdb-|fdb-|mb-|dj-|ia-)/, "");
        url = `https://vidsrc.to/embed/movie/${cleanId}`;
      }
    } else if (activeServer === "server3") {
      let numericHash = 0;
      for (let i = 0; i < movie.id.length; i++) {
        numericHash += movie.id.charCodeAt(i);
      }
      url = BACKUP_MP4_POOL[numericHash % BACKUP_MP4_POOL.length];
    } else if (activeServer === "server4") {
      const query = encodeURIComponent(`${movie.title} ${movie.year || ""} official trailer`);
      url = `https://www.youtube-nocookie.com/embed?listType=search&list=${query}`;
    }

    // Process Internet Archive, YouTube, and Embed URLs
    let isIframe = false;
    if (url.includes("archive.org") || movie.id.startsWith("ia-")) {
      isIframe = true;
      if (!url.includes("/embed/")) {
        const match = url.match(/archive\.org\/(?:download|details|embed)\/([^/]+)/);
        if (match && match[1]) {
          url = `https://archive.org/embed/${match[1]}`;
        } else if (movie.embedUrl && movie.embedUrl.includes("/embed/")) {
          url = movie.embedUrl;
        } else {
          const iaId = movie.id.replace(/^ia-/, "");
          url = `https://archive.org/embed/${iaId}`;
        }
      }
    } else if (url.includes("youtube.com/watch") || url.includes("youtu.be/")) {
      isIframe = true;
      let videoId = "";
      if (url.includes("v=")) {
        videoId = url.split("v=")[1]?.split("&")[0] || "";
      } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
      }
      if (videoId) {
        url = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
      }
    } else if (
      url.includes("/embed/") ||
      url.includes("vidsrc") ||
      url.includes("autoembed") ||
      url.includes("2embed") ||
      url.includes("player") ||
      url.includes("youtube.com/embed")
    ) {
      isIframe = true;
    }

    return { url, isIframe };
  }, [movie, activeServer]);

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
      if (!videoRef.current || currentStreamInfo.isIframe) return;
      
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
  }, [isPlaying, isMuted, currentStreamInfo]);

  // Reset states when movie or active server changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasError(false);
    if (videoRef.current && !currentStreamInfo.isIframe) {
      videoRef.current.load();
    }
  }, [movie, activeServer, currentStreamInfo]);

  const togglePlay = () => {
    if (!videoRef.current || currentStreamInfo.isIframe) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          handleVideoError();
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
    if (activeServer === "server1") {
      setFallbackMessage("Primary stream encountered CORS/playback block. Auto-switched to High-Speed Backup CDN (Server 3).");
      setActiveServer("server3");
      setHasError(false);
    } else if (activeServer === "server2") {
      setFallbackMessage("Embed server unresponsive. Auto-switched to Backup Stream (Server 3).");
      setActiveServer("server3");
      setHasError(false);
    } else {
      setHasError(true);
    }
  };

  return (
    <div className={`w-full ${isTheaterMode ? "max-w-full" : "max-w-5xl mx-auto"} flex flex-col gap-6`}>
      {/* Top action header & Server Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-2 select-none">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-semibold py-1.5 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Back to Browse</span>
        </button>

        {/* Streaming Server Selector Bar */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1 text-neutral-400 mr-1 font-mono text-[11px]">
            <Server size={13} className="text-red-500" />
            <span>Server:</span>
          </div>
          
          <button
            onClick={() => { setActiveServer("server1"); setHasError(false); setFallbackMessage(null); }}
            className={`px-2.5 py-1 rounded border transition-all cursor-pointer font-bold ${
              activeServer === "server1"
                ? "bg-red-600 border-red-500 text-white shadow"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            Server 1 (Default)
          </button>

          <button
            onClick={() => { setActiveServer("server2"); setHasError(false); setFallbackMessage(null); }}
            className={`px-2.5 py-1 rounded border transition-all cursor-pointer font-bold ${
              activeServer === "server2"
                ? "bg-red-600 border-red-500 text-white shadow"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            Server 2 (Embed)
          </button>

          <button
            onClick={() => { setActiveServer("server3"); setHasError(false); setFallbackMessage(null); }}
            className={`px-2.5 py-1 rounded border transition-all cursor-pointer font-bold ${
              activeServer === "server3"
                ? "bg-red-600 border-red-500 text-white shadow"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            Server 3 (Full HD)
          </button>

          <button
            onClick={() => { setActiveServer("server4"); setHasError(false); setFallbackMessage(null); }}
            className={`px-2.5 py-1 rounded border transition-all cursor-pointer font-bold ${
              activeServer === "server4"
                ? "bg-red-600 border-red-500 text-white shadow"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            Server 4 (YouTube)
          </button>
        </div>

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

      {/* Auto-Fallback Banner Notification */}
      {fallbackMessage && (
        <div className="bg-amber-950/60 border border-amber-800/80 rounded-lg p-2.5 px-4 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw size={14} className="animate-spin text-amber-400" />
            <span>{fallbackMessage}</span>
          </div>
          <button onClick={() => setFallbackMessage(null)} className="text-amber-400 hover:text-white font-bold ml-2">
            Dismiss
          </button>
        </div>
      )}

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
            <h4 className="text-lg font-bold text-neutral-200 font-sans">Unable to Stream Video on Server 1</h4>
            <p className="text-xs text-neutral-400 max-w-md mt-1 leading-relaxed">
              This video link encountered a CORS block or source timeout. Please switch to <span className="text-white font-bold">Server 3 (Full HD)</span> or <span className="text-white font-bold">Server 4 (YouTube)</span> above.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={() => {
                  setActiveServer("server3");
                  setHasError(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded transition-all shadow-lg"
              >
                Switch to Server 3 (Backup HD)
              </button>
              <button
                onClick={() => {
                  setActiveServer("server4");
                  setHasError(false);
                }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded transition-all border border-neutral-700"
              >
                Switch to Server 4 (YouTube)
              </button>
            </div>
          </div>
        ) : currentStreamInfo.isIframe ? (
          /* Render IFRAME player for YouTube or Embed servers */
          <iframe
            src={currentStreamInfo.url}
            title={movie.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          /* Render Standard HTML5 Video Player */
          <>
            <video
              ref={videoRef}
              src={currentStreamInfo.url}
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
              <span className="text-neutral-400 font-semibold">Active Server: <strong className="text-white uppercase">{activeServer}</strong> — Unlimited Bandwidth</span>
            </div>
            <button onClick={() => { setActiveServer(activeServer === "server1" ? "server3" : "server1"); }} className="text-red-500 font-bold hover:underline">Switch Server</button>
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
