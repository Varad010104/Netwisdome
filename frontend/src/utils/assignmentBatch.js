export const toIdString = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    const nestedId = value._id || value.id || value.$oid || "";
    if (nestedId) return String(nestedId);
    if (typeof value.toString === "function") {
      const raw = value.toString();
      if (raw && raw !== "[object Object]") return String(raw);
    }
    return "";
  }
  return String(value);
};

export const getAssignmentBatchIds = (assignment) => {
  const nextBatchIds = Array.isArray(assignment?.batchIds)
    ? assignment.batchIds.map((id) => toIdString(id)).filter(Boolean)
    : [];
  const legacyBatchId = toIdString(assignment?.batchId);
  const lowercaseLegacyBatchId = toIdString(assignment?.batchid);
  const uppercaseLegacyBatchId = toIdString(assignment?.batchID);
  return Array.from(
    new Set([
      ...nextBatchIds,
      ...(legacyBatchId ? [legacyBatchId] : []),
      ...(lowercaseLegacyBatchId ? [lowercaseLegacyBatchId] : []),
      ...(uppercaseLegacyBatchId ? [uppercaseLegacyBatchId] : []),
    ])
  );
};

export const assignmentMatchesBatch = (assignment, userBatchId) => {
  const normalizedUserBatchId = toIdString(userBatchId);
  if (!normalizedUserBatchId) return false;
  return getAssignmentBatchIds(assignment).some(
    (id) => String(id) === String(normalizedUserBatchId)
  );
};
