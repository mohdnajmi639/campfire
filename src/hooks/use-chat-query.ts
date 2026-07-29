"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

interface UseChatQueryProps {
  queryKey: string;
  apiUrl: string;
  paramKey: string;
  paramValue: string;
}

export function useChatQuery({
  queryKey,
  apiUrl,
  paramKey,
  paramValue,
}: UseChatQueryProps) {
  const fetchMessages = async ({ pageParam }: { pageParam?: string }) => {
    const url = new URL(apiUrl, window.location.origin);
    url.searchParams.set(paramKey, paramValue);
    if (pageParam) {
      url.searchParams.set("cursor", pageParam);
    }

    const res = await fetch(url.toString());
    return res.json();
  };

  return useInfiniteQuery({
    queryKey: [queryKey],
    queryFn: fetchMessages,
    getNextPageParam: (lastPage) => lastPage?.nextCursor,
    initialPageParam: undefined as string | undefined,
    refetchInterval: 1000 * 60, // Fallback polling every 60s
  });
}
