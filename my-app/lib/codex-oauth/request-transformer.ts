const ENCRYPTED_REASONING_INCLUDE = "reasoning.encrypted_content";

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

  return input.flatMap((item) => {
    if (!isJsonObject(item)) {
      return [item];
    }

    if (item.type === "item_reference") {
      return [];
    }

    const { id: _id, ...itemWithoutId } = item;
    return [itemWithoutId];
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
