// Normalize field names between form data, store, and API responses.
// The store always uses these canonical keys so restore logic doesn't need fallback chains.

export function mapContactToStore(data: Record<string, any>): Record<string, any> {
  return {
    first_name: data.first_name || data.firstName || '',
    last_name: data.last_name || data.lastName || '',
    email: data.email || '',
    phone_number: data.phone_number || data.phone || data.phoneNumber || '',
    phone_country_code: data.phone_country_code || data.phoneCountryCode || '',
    job_title: data.job_title || data.jobTitle || '',
  };
}

export function mapAddressToStore(data: Record<string, any>): Record<string, any> {
  return {
    street_address: data.street_address || data.streetAddress || '',
    city: data.city || '',
    state_province: data.state_province || data.state || '',
    postal_code: data.postal_code || data.postalCode || '',
    country: data.country || '',
    address_confirmed: data.address_confirmed ?? data.addressConfirmed ?? false,
  };
}

export function mapStoreSetupToStore(data: Record<string, any>): Record<string, any> {
  return {
    business_model: data.business_model || data.businessModel || '',
    subdomain: data.subdomain || '',
    storefront_slug: data.storefront_slug || data.storefrontSlug || '',
    currency: data.currency || '',
    timezone: data.timezone || '',
    language: data.language || 'en',
    logo: data.logo || '',
  };
}
