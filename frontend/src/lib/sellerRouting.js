export function sellerStatusRank(status) {
  if (status === "approved") return 3;
  if (status === "pending") return 2;
  return 1;
}

function toTime(value) {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

export function pickPrimarySellerBusiness(businesses = []) {
  if (!Array.isArray(businesses) || businesses.length === 0) return null;

  return [...businesses].sort((a, b) => {
    const statusDiff = sellerStatusRank(b?.status) - sellerStatusRank(a?.status);
    if (statusDiff !== 0) return statusDiff;

    const updatedDiff = toTime(b?.updated_at) - toTime(a?.updated_at);
    if (updatedDiff !== 0) return updatedDiff;

    return toTime(b?.created_at) - toTime(a?.created_at);
  })[0];
}

export function getSellerEntryRoute(user, businesses = []) {
  if (!user) return "/seller-auth";

  const primaryBusiness = pickPrimarySellerBusiness(businesses);

  if (!primaryBusiness) return "/list-your-business";
  if (primaryBusiness.status === "approved") return "/seller-dashboard";
  if (primaryBusiness.status === "pending") return "/application-pending";

  return "/list-your-business";
}
