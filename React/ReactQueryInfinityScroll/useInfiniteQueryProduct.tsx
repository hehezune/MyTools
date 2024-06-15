/**
 * useIntersect : 리스트 담아오는 API 요청만 onIntersect로 받아오고,
 * intersectionObserver와 hasNext, pageNumber는 사용자 정의 hook 내부에서 처리하는 함수
 * @param onIntersect : API 요청 받아오는 함수
 * options : observer 속성 (선택)
 */

import { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { IIntersectionObserverInit } from '../types/util/useIntersect';

const defaultOptions: IIntersectionObserverInit = {
  root: null,
  threshold: 1,
  rootMargin: '0px',
};

const useInfiniteQueryProduct = (
  queryKey: {
    constant: string;
    variables: number[];
    stringVariables?: string[];
  },
  wrapperQueryFn: () => Function,
  options: IIntersectionObserverInit,
) => {
  const queryFunction = wrapperQueryFn();
  const { data, hasNextPage, fetchNextPage, isPending, refetch } =
    useInfiniteQuery({
      queryKey: [
        queryKey.constant,
        ...queryKey.variables,
        queryKey.stringVariables,
      ],
      queryFn: ({ pageParam }) =>
        queryFunction({
          pageParam,
          content: queryKey.stringVariables?.[0],
          variables: queryKey.variables,
        }),
      initialPageParam: 0,
      getNextPageParam: lastPage => {
        return lastPage.last ? null : lastPage.number + 1;
      },
      staleTime: 500000,
    });
  const [ref, setRef] = useState<Element | null>(null);
  const checkIntersect = useCallback(
    async ([entry]: IntersectionObserverEntry[]) => {
      if (!entry.isIntersecting) return;

      // 불러올게 없을때
      if (!hasNextPage) return;

      // onIntersect는 API 요청을 통해 list를 갱신하고, hasNext여부를 boolean으로 전달해야 함
      // if (!isPending) {
      fetchNextPage();
      // }
    },
    [queryFunction, hasNextPage],
  );

  useEffect(() => {
    let observer: IntersectionObserver | undefined;
    if (ref) {
      observer = new IntersectionObserver(checkIntersect, {
        ...defaultOptions,
        ...options,
      });
      observer.observe(ref);
    }
    return () => observer && observer.disconnect();
  }, [
    ref,
    options.root,
    options.threshold,
    options.rootMargin,
    checkIntersect,
  ]);

  return [ref, setRef, data?.pages, isPending, refetch] as const;
};

export default useInfiniteQueryProduct;
