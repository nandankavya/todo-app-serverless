// src/index.js
exports.handler = async (event) => {
  const method = (event.httpMethod || '').toUpperCase();
  const id = event.pathParameters && event.pathParameters.id;

  const json = (statusCode, body) => ({
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  try {
    if (method === 'GET' && !id) {
      return json(200, { todos: [] });
    }

    if (method === 'POST' && !id) {
      const payload = event.body ? JSON.parse(event.body) : {};
      return json(201, { message: 'todo created (placeholder)', todo: payload });
    }

    if (method === 'GET' && id) {
      return json(200, { todo: { id, title: `Sample todo ${id}`, completed: false } });
    }

    if ((method === 'PUT' || method === 'PATCH') && id) {
      const payload = event.body ? JSON.parse(event.body) : {};
      return json(200, { message: 'todo updated (placeholder)', id, updates: payload });
    }

    if (method === 'DELETE' && id) {
      return json(200, { message: 'todo deleted (placeholder)', id });
    }

    return json(400, { message: 'Unsupported route or method', method, path: event.path });
  } catch (err) {
    console.error(err);
    return json(500, { message: 'Internal server error', error: String(err) });
  }
};
