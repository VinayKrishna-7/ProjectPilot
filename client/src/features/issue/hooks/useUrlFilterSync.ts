import { useSearchParams } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useFilterStore, IssueFilters } from '@/stores/filterStore';

export function useUrlFilterSync() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, setFilters } = useFilterStore();
  const isInitialMount = useRef(true);

  // 1. On mount: read URL search params into filter store
  useEffect(() => {
    const urlFilters: IssueFilters = {};
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const type = searchParams.get('type');
    const assignee = searchParams.get('assignee');
    const search = searchParams.get('search');
    const sprint = searchParams.get('sprint');

    if (status) urlFilters.status = status;
    if (priority) urlFilters.priority = priority;
    if (type) urlFilters.type = type;
    if (assignee) urlFilters.assignee = assignee;
    if (search) urlFilters.search = search;
    if (sprint) urlFilters.sprint = sprint;

    if (Object.keys(urlFilters).length > 0) {
      setFilters(urlFilters);
    }
  }, []);

  // 2. When filter store updates: sync to URL search params
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    const keys: Array<keyof IssueFilters> = ['status', 'priority', 'type', 'assignee', 'search', 'sprint'];

    keys.forEach((key) => {
      const val = filters[key];
      if (val) {
        nextParams.set(key, val);
      } else {
        nextParams.delete(key);
      }
    });

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [filters]);
}
