// src/index.js
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");

const REGION = process.env.AWS_REGION || "ap-south-1";
const TABLE_NAME = process.env.TABLE_NAME;

if (!TABLE_NAME) {
  console.error("TABLE_NAME environment variable is required.");
}

const ddbClient = new DynamoDBClient({ region: REGION });
const ddb = DynamoDBDocumentClient.from(ddbClient);

/**
 * Expects:
 * - GET /todos                -> list todos
 * - POST /todos               -> create todo (JSON body)
 * - GET /todos/{id}           -> get one
 * - PUT /todos/{id}           -> update (JSON body)
 * - DELETE /todos/{id}        -> delete
 *
 * Item shape (example):
 * { id: "123", title: "Buy milk", completed: false, createdAt: "..." }
 */

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  const method = (event.httpMethod || "").toUpperCase();
  const id = event.pathParameters && event.pathParameters.id;

  try {
    // LIST
    if (method === "GET" && !id) {
      const cmd = new ScanCommand({ TableName: TABLE_NAME });
      const res = await ddb.send(cmd);
      const items = res.Items || [];
      return json(200, { todos: items });
    }

    // CREATE
    if (method === "POST" && !id) {
      const payload = event.body ? JSON.parse(event.body) : {};
      if (!payload.id) {
        return json(400, { message: "id is required in POST body" });
      }
      const item = {
        ...payload,
        createdAt: new Date().toISOString(),
      };
      await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
      return json(201, { message: "todo created", todo: item });
    }

    // GET one
    if (method === "GET" && id) {
      const res = await ddb.send(new GetCommand({ TableName: TABLE_NAME, Key: { id } }));
      if (!res.Item) return json(404, { message: "todo not found", id });
      return json(200, { todo: res.Item });
    }

    // UPDATE
    if ((method === "PUT" || method === "PATCH") && id) {
      const payload = event.body ? JSON.parse(event.body) : {};
      // Build a simple UpdateExpression from provided fields (title, completed, etc.)
      const fields = Object.keys(payload);
      if (fields.length === 0) return json(400, { message: "no fields to update" });

      const exprAttrNames = {};
      const exprAttrValues = {};
      const setParts = [];

      fields.forEach((f, idx) => {
        const nameKey = `#f${idx}`;
        const valKey = `:v${idx}`;
        exprAttrNames[nameKey] = f;
        exprAttrValues[valKey] = payload[f];
        setParts.push(`${nameKey} = ${valKey}`);
      });

      const updateParams = {
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: `SET ${setParts.join(", ")}`,
        ExpressionAttributeNames: exprAttrNames,
        ExpressionAttributeValues: exprAttrValues,
        ReturnValues: "ALL_NEW",
      };

      const res = await ddb.send(new UpdateCommand(updateParams));
      return json(200, { message: "todo updated", todo: res.Attributes });
    }

    // DELETE
    if (method === "DELETE" && id) {
      await ddb.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { id } }));
      return json(200, { message: "todo deleted", id });
    }

    return json(400, { message: "Unsupported route or method", method, path: event.path });
  } catch (err) {
    console.error("Handler error:", err);
    return json(500, { message: "Internal server error", error: String(err) });
  }
};
