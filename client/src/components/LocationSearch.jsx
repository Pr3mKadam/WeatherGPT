import { useEffect, useRef, useState } from 'react';
import { Loader2, LocateFixed, MapPin, Search, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { useLocation } from '../context/LocationContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function LocationSearch() {
  const { location, setLocation, detectLocation, locating } = useLocation();
  const { notify } = useToast();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const timer = window.setTimeout(() => {
      api
        .get(`/geo/search?q=${encodeURIComponent(term)}`, { signal: controller.signal })
        .then((response) => {
          if (cancelled) return;
          setResults(response.results || []);
          setActiveIndex(0);
        })
        .catch((requestError) => {
          if (cancelled || requestError.name === 'AbortError') return;
          setResults([]);
          setError(requestError);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  function choose(result) {
    setLocation(result);
    setQuery('');
    setResults([]);
    setOpen(false);
    setError(null);
    inputRef.current?.blur();
    notify(
      `Showing ${result.name}${result.admin1 ? `, ${result.admin1}` : ''}`,
      'success'
    );
  }

  async function handleLocate() {
    try {
      const resolved = await detectLocation();
      setOpen(false);
      setQuery('');
      notify(`Using your location${resolved?.name ? ` near ${resolved.name}` : ''}.`, 'success');
    } catch (locationError) {
      notify(locationError.message || 'Could not detect your location.', 'error');
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (open && results[activeIndex]) choose(results[activeIndex]);
    }
  }

  const showPopover = open;

  return (
    <div className="location-search" ref={wrapperRef}>
      <div className="search-field">
        <Search size={16} className="search-icon" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={`${location.name} — search another city`}
          aria-label="Search for a city or district"
          role="combobox"
          aria-expanded={showPopover}
          aria-controls="location-search-results"
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck="false"
        />
        {query ? (
          <button
            type="button"
            className="search-clear"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
          >
            <X size={14} />
          </button>
        ) : (
          <button
            type="button"
            className="search-locate-inline"
            aria-label="Use my current location"
            title="Use my current location"
            onClick={handleLocate}
            disabled={locating}
          >
            {locating ? <Loader2 size={15} className="spin" /> : <LocateFixed size={15} />}
          </button>
        )}
      </div>

      {showPopover && (
        <div className="search-popover" id="location-search-results" role="listbox">
          <button
            type="button"
            className="search-locate"
            onClick={handleLocate}
            disabled={locating}
          >
            {locating ? <Loader2 size={16} className="spin" /> : <LocateFixed size={16} />}
            <span>{locating ? 'Finding your location…' : 'Use my current location'}</span>
          </button>

          <div className="search-divider" />

          {loading && (
            <div className="search-status">
              <Loader2 size={15} className="spin" />
              Searching places…
            </div>
          )}

          {!loading && error && (
            <div className="search-status search-status-error">{error.message}</div>
          )}

          {!loading && !error && query.trim().length < 2 && (
            <div className="search-status">
              Type at least two characters, or use your current location.
            </div>
          )}

          {!loading && !error && query.trim().length >= 2 && results.length === 0 && (
            <div className="search-status">No places found. Try a nearby city or district.</div>
          )}

          {results.map((result, index) => (
            <button
              type="button"
              key={`${result.id}-${result.lat}-${result.lon}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`search-option ${index === activeIndex ? 'is-active' : ''}`.trim()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => choose(result)}
            >
              <MapPin size={16} aria-hidden="true" />
              <span className="search-option-copy">
                <strong>{result.name}</strong>
                <small>{[result.admin1, result.country].filter(Boolean).join(', ') || 'Location'}</small>
              </span>
              {result.countryCode && <span className="search-option-code">{result.countryCode}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
