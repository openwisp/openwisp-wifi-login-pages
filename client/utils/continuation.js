import {matchPath} from "react-router-dom";
import routes from "../constants/routes";
import {sessionStorage} from "./storage";

const storageKey = "ow_continuation";
const hasControls = (value) =>
  value
    .split("")
    .some(
      (character) =>
        character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
    );

const matchRoute = (route, orgSlug, path) =>
  matchPath(
    {path: `/${orgSlug}/${route.path}`, end: true, caseSensitive: true},
    path,
  );

// Tells whether `path` is an instance of the given route of the organization.
export const isRoute = (path, orgSlug, route) =>
  Boolean(matchRoute(route, orgSlug, path));

// Validates a `next` destination: returns `{url}` only for a same-organization
// path of a route flagged with `continuation`, otherwise `null`.
export const resolveDestination = (destination, orgSlug) => {
  if (typeof destination !== "string" || !orgSlug) return null;
  if (
    !/^\/(?!\/)/.test(destination) ||
    /[\\\s?#]/.test(destination) ||
    hasControls(destination)
  ) {
    return null;
  }
  try {
    const decoded = decodeURIComponent(destination);
    if (
      /%|\\/.test(decoded) ||
      hasControls(decoded) ||
      decoded !== destination ||
      destination.split("/").some((part) => part === "." || part === "..")
    )
      return null;
    if (!destination.startsWith(`/${orgSlug}/`)) return null;
    if (new URL(destination, window.location.origin).pathname !== destination)
      return null;
    const route = Object.values(routes).find((entry) => {
      if (!entry.continuation) return false;
      const match = matchRoute(entry, orgSlug, destination);
      return (
        match &&
        (!entry.statuses || entry.statuses.includes(match.params.status))
      );
    });
    return route ? {url: destination} : null;
  } catch {
    return null;
  }
};

// Persists the continuation record in the tab's sessionStorage.
const saveRecord = (record) => {
  sessionStorage.setItem(storageKey, JSON.stringify(record));
  return record;
};

// Discards the pending continuation.
export const clearContinuation = () => {
  sessionStorage.removeItem(storageKey);
};

// Returns the pending continuation of the organization, or `null` (clearing
// it) if it is missing, malformed, expired or of another organization.
export const readContinuation = (orgSlug, {now = Date.now()} = {}) => {
  try {
    const record = JSON.parse(sessionStorage.getItem(storageKey) || "null");
    if (!record) return null;
    const fields = [
      "version",
      "orgSlug",
      "createdAt",
      "username",
      "destination",
    ];
    if (
      Object.keys(record).some((key) => !fields.includes(key)) ||
      record.version !== 1 ||
      record.orgSlug !== orgSlug ||
      !Number.isFinite(record.createdAt) ||
      record.createdAt > now ||
      now - record.createdAt >= 30 * 60 * 1000 ||
      (record.username !== null && typeof record.username !== "string") ||
      !resolveDestination(record.destination, orgSlug)
    ) {
      clearContinuation();
      return null;
    }
    return record;
  } catch {
    clearContinuation();
    return null;
  }
};

// Starts a continuation from the `next` query param of the login URL.
// Any previous continuation is discarded; invalid or repeated `next` is ignored.
export const beginContinuation = (search, orgSlug, {now = Date.now()} = {}) => {
  clearContinuation();
  try {
    decodeURIComponent(search);
    const values = new URLSearchParams(search).getAll("next");
    const destination =
      values.length === 1 && resolveDestination(values[0], orgSlug);
    if (!destination) return null;
    return saveRecord({
      version: 1,
      orgSlug,
      createdAt: now,
      username: null,
      destination: destination.url,
    });
  } catch {
    return null;
  }
};

// Binds the continuation to the authenticated user; clears it if it was
// already bound to a different user.
export const bindContinuation = (orgSlug, username) => {
  const record = readContinuation(orgSlug);
  if (!record || !username) return null;
  if (record.username && record.username !== username) {
    clearContinuation();
    return null;
  }
  return saveRecord({...record, username});
};

const owned = (orgSlug, username) => {
  const record = readContinuation(orgSlug);
  return record && record.username === username ? record : null;
};

// Consumes the continuation of `username` and returns its destination.
export const takeContinuation = (orgSlug, username) => {
  const record = owned(orgSlug, username);
  if (!record) return null;
  clearContinuation();
  return resolveDestination(record.destination, orgSlug);
};

// Moves the continuation to a new username (phone verification renames it).
export const rebindContinuation = (orgSlug, oldUsername, username) => {
  const record = owned(orgSlug, oldUsername);
  if (!record || !username) return null;
  return saveRecord({...record, username});
};
