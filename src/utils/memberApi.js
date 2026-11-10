import api from '../api/axiosClient';

export async function fetchAllMembers(pageSize = 200) {
  const firstPage = await api.get('/members', {
    params: { limit: pageSize, page: 1 }
  });
  const totalPages = Math.max(1, Number(firstPage.data.totalPages) || 1);
  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      api.get('/members', {
        params: { limit: pageSize, page: index + 2 }
      })
    )
  );

  return [
    ...(firstPage.data.members || []),
    ...remainingPages.flatMap((response) => response.data.members || [])
  ];
}
