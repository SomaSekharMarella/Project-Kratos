export function useErrorMessage() {
  function getReadableError(error) {
    const raw =
      error?.shortMessage ||
      error?.reason ||
      error?.message ||
      error?.info?.error?.message ||
      "Transaction failed";

    if (String(raw).includes("missing revert data")) {
      return "Transaction reverted. Check election id, wallet role, and network.";
    }
    return String(raw);
  }

  return { getReadableError };
}

