function paginate(query, { page = 1, limit = 20 } = {}) {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset, sql: ` LIMIT ${limit} OFFSET ${offset}` };
}

function paginatedResponse(data, { page, limit, total }) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = { paginate, paginatedResponse };
