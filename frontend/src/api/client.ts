const API_BASE = '/api';
const HTTP_BAD_REQUEST = 400;

export type FieldErrors = Readonly<Record<string, ReadonlyArray<string>>>;
export type QueryParams = Readonly<Record<string, string | number | undefined>>;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(describeFailure(status, body));
  }
}

export async function requestJson<TResult>(
  path: string,
  init: RequestInit = {},
): Promise<TResult> {
  const response = await send(path, init);
  return response.json();
}

export async function requestEmpty(
  path: string,
  init: RequestInit = {},
): Promise<void> {
  await send(path, init);
}

export function buildQuery(params: QueryParams = {}): string {
  const entries = Object.entries(params).flatMap(([key, value]) =>
    value === undefined || value === '' ? [] : [[key, String(value)]],
  );
  const query = new URLSearchParams(entries).toString();
  return query ? `?${query}` : '';
}

export function getFieldErrors(error: unknown): FieldErrors {
  if (
    !(error instanceof ApiError) ||
    error.status !== HTTP_BAD_REQUEST ||
    !isFieldErrors(error.body)
  ) {
    return {};
  }
  return error.body;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

async function send(path: string, init: RequestInit): Promise<Response> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  if (!response.ok) {
    throw new ApiError(response.status, await readBody(response));
  }
  return response;
}

async function readBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return;
  }
}

function isFieldErrors(body: unknown): body is FieldErrors {
  return (
    typeof body === 'object' &&
    body !== null &&
    Object.values(body).every((messages) => Array.isArray(messages))
  );
}

function describeFailure(status: number, body: unknown): string {
  if (
    typeof body === 'object' &&
    body !== null &&
    'detail' in body &&
    typeof body.detail === 'string'
  ) {
    return body.detail;
  }
  return `The server answered ${status}.`;
}
