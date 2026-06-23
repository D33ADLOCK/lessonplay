const ENCRYPTED_REASONING_INCLUDE = "reasoning.encrypted_content";

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringifyToolOutput(output: unknown) {
  if (typeof output === "string") {
    return output;
  }

  try {
    return JSON.stringify(output);
  } catch {
    return String(output);
  }
}

function createToolOutputContextMessage(item: JsonObject) {
  const callId = typeof item.call_id === "string" ? item.call_id : "unknown";
  const output = stringifyToolOutput(item.output);

  return {
    type: "message",
    role: "user",
    content: [
      {
        type: "input_text",
        text: `Tool result for ${callId}:\n${output}`,
      },
    ],
  };
}

export function normalizeCodexModel(
  requestedModel: unknown,
  fallbackModel = "gpt-5.5",
) {
  if (typeof requestedModel !== "string" || requestedModel.trim() === "") {
    return fallbackModel;
  }

  if (requestedModel.includes("codex")) {
    return requestedModel;
  }

  return fallbackModel;
}

export function ensureIncludes(include: unknown, requiredInclude: string) {
  const existingIncludes = Array.isArray(include)
    ? include.filter((item): item is string => typeof item === "string")
    : [];

  if (existingIncludes.includes(requiredInclude)) {
    return existingIncludes;
  }

  return [...existingIncludes, requiredInclude];
}

export function sanitizeCodexInput(input: unknown) {
  if (!Array.isArray(input)) {
    return input;
  }

  const sanitizedItems = input.flatMap((item) => {
    if (!isJsonObject(item)) {
      return [item];
    }

    if (item.type === "item_reference") {
      return [];
    }

    if (item.type !== "message") {
      return [item];
    }

    const { id: _id, ...itemWithoutId } = item;
    return [itemWithoutId];
  });

  const functionCallIds = new Set(
    sanitizedItems
      .filter(
        (item): item is JsonObject =>
          isJsonObject(item) &&
          item.type === "function_call" &&
          typeof item.call_id === "string",
      )
      .map((item) => item.call_id as string),
  );

  return sanitizedItems.flatMap((item) => {
    if (!isJsonObject(item) || item.type !== "function_call_output") {
      return [item];
    }

    if (typeof item.call_id !== "string") {
      return [];
    }

    if (functionCallIds.has(item.call_id)) {
      return [item];
    }

    return [createToolOutputContextMessage(item)];
  });
}

export function transformCodexRequestBody(
  body: unknown,
  options: { model?: string } = {},
) {
  if (!isJsonObject(body)) {
    return body;
  }

  const transformedBody: JsonObject = {
    ...body,
    model: normalizeCodexModel(body.model, options.model),
    store: false,
    stream: true,
    include: ensureIncludes(body.include, ENCRYPTED_REASONING_INCLUDE),
    input: sanitizeCodexInput(body.input),
  };

  delete transformedBody.max_output_tokens;
  delete transformedBody.max_completion_tokens;

  return transformedBody;
}
