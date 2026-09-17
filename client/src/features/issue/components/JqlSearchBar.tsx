import React, { useState, useEffect, useRef } from 'react';
import { Search, Code2, Sparkles, X, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { JqlSuggestion, IIssue } from '@taskflow/shared';

interface JqlSearchBarProps {
  projectId: string;
  onJqlResults?: (issues: IIssue[] | null, isJqlActive: boolean) => void;
  className?: string;
}

export const JqlSearchBar: React.FC<JqlSearchBarProps> = ({
  projectId,
  onJqlResults,
  className = '',
}) => {
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<JqlSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions when query changes in advanced mode
  useEffect(() => {
    if (!isAdvanced) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/projects/${projectId}/jql/suggest`, {
          params: { q: query },
        });
        setSuggestions((res.data as any).data?.suggestions || []);
      } catch {}
    }, 200);

    return () => clearTimeout(timer);
  }, [query, isAdvanced, projectId]);

  // Handle outside click to hide suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      onJqlResults?.(null, false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/projects/${projectId}/jql/search`, {
        params: { q: query },
      });
      const issues = (res.data as any).data?.issues || [];
      onJqlResults?.(issues, true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Syntax error in JQL query');
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (val: string) => {
    const parts = query.split(/\s+/);
    parts.pop();
    const newQuery = [...parts, val].join(' ') + ' ';
    setQuery(newQuery);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setQuery('');
    setError(null);
    onJqlResults?.(null, false);
  };

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
              if (error) setError(null);
            }}
            onFocus={() => isAdvanced && setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch(e);
            }}
            placeholder={
              isAdvanced
                ? 'e.g. status = done AND priority in (high, highest) ORDER BY position ASC'
                : 'Filter issues by summary, key, or assignee...'
            }
            className={`pl-9 pr-8 text-xs font-mono h-9 ${
              isAdvanced ? 'bg-background border-primary/50' : 'bg-muted/30'
            }`}
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Button
          type="button"
          size="sm"
          variant={isAdvanced ? 'default' : 'outline'}
          onClick={() => {
            setIsAdvanced(!isAdvanced);
            setShowSuggestions(!isAdvanced);
          }}
          className="text-xs h-9 gap-1.5 px-3"
        >
          <Code2 className="h-3.5 w-3.5" />
          JQL
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={handleSearch}
          disabled={loading}
          className="text-xs h-9 px-3"
        >
          Search
        </Button>
      </div>

      {error && (
        <div className="text-[11px] text-destructive bg-destructive/10 px-3 py-1.5 rounded-md">
          {error}
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {isAdvanced && showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-20 top-11 z-50 rounded-lg border bg-popover text-popover-foreground shadow-lg overflow-hidden">
          <div className="p-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/40 border-b flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            JQL Grammar Suggestions
          </div>
          <div className="max-h-48 overflow-y-auto p-1 divide-y divide-border/40">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-accent rounded transition-colors"
                onClick={() => applySuggestion(sug.value)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-foreground">{sug.value}</span>
                  <span className="text-[11px] text-muted-foreground">{sug.description}</span>
                </div>
                <Badge variant="outline" className="text-[9px] uppercase tracking-wider h-4">
                  {sug.category}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick query presets */}
      {isAdvanced && !query && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] text-muted-foreground">Try presets:</span>
          {[
            'status = in_progress',
            'assignee = me',
            'priority in (high, highest)',
            'status != done ORDER BY priority DESC',
          ].map((preset) => (
            <button
              key={preset}
              type="button"
              className="text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground font-mono px-2 py-0.5 rounded transition-colors"
              onClick={() => {
                setQuery(preset);
                setTimeout(() => handleSearch(), 50);
              }}
            >
              {preset}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
