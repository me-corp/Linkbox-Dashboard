// Known dial codes, ported from the mobile app's
// lib/core/constants/country_codes.dart so both apps agree on the same
// set. Sorted longest-first so splitLegacyNumber() tries 4-digit codes
// (e.g. "+1868" Trinidad & Tobago) before falling back to shorter ones
// that would otherwise wrongly match first (e.g. the NANP "+1" shared by
// the US/Canada and several Caribbean nations with their own 4-digit codes).
const DIAL_CODES = [
  '+1', '+1664', '+1758', '+1784', '+1868', '+1869', '+20', '+212', '+213',
  '+216', '+218', '+220', '+221', '+222', '+223', '+224', '+225', '+226',
  '+227', '+228', '+229', '+230', '+231', '+232', '+233', '+234', '+235',
  '+236', '+237', '+238', '+239', '+240', '+241', '+242', '+243', '+244',
  '+245', '+248', '+249', '+250', '+251', '+252', '+253', '+254', '+255',
  '+256', '+257', '+258', '+260', '+261', '+262', '+263', '+264', '+265',
  '+266', '+267', '+268', '+269', '+27', '+290', '+291', '+297', '+298',
  '+299', '+30', '+31', '+32', '+33', '+34', '+350', '+351', '+352', '+353',
  '+354', '+355', '+356', '+357', '+358', '+359', '+36', '+370', '+371',
  '+372', '+373', '+374', '+375', '+376', '+377', '+378', '+380', '+381',
  '+382', '+385', '+386', '+387', '+389', '+39', '+40', '+41', '+420',
  '+421', '+423', '+43', '+44', '+45', '+46', '+47', '+48', '+49', '+500',
  '+501', '+502', '+503', '+504', '+505', '+506', '+507', '+508', '+509',
  '+51', '+52', '+53', '+54', '+55', '+56', '+57', '+58', '+591', '+592',
  '+593', '+594', '+595', '+596', '+597', '+598', '+599', '+60', '+61',
  '+62', '+63', '+64', '+65', '+66', '+673', '+674', '+675', '+676', '+677',
  '+678', '+679', '+680', '+681', '+682', '+683', '+685', '+686', '+687',
  '+688', '+689', '+690', '+691', '+692', '+7', '+81', '+82', '+84', '+850',
  '+852', '+853', '+855', '+856', '+86', '+876', '+880', '+886', '+90',
  '+91', '+92', '+93', '+94', '+960', '+961', '+962', '+963', '+964',
  '+965', '+966', '+967', '+968', '+970', '+971', '+972', '+973', '+974',
  '+975', '+976', '+977', '+98', '+992', '+993', '+994', '+995', '+996',
  '+998',
].sort((a, b) => b.length - a.length)

// Splits a legacy full-E.164 value (e.g. "+18685551234") back into
// { countryCode, number } via a longest-prefix match against DIAL_CODES.
// Returns null if no known dial code matches (leaves it for manual review
// rather than guessing).
export function splitLegacyNumber(fullNumber) {
  if (!fullNumber || !fullNumber.startsWith('+')) return null

  const match = DIAL_CODES.find(code => fullNumber.startsWith(code))
  if (!match) return null

  return {
    countryCode: match,
    number: fullNumber.slice(match.length),
  }
}

export function getUserIssues(user) {
  const issues = []

  if (
    user.isGuest !== true &&
    user.isGuest !== false
  ) {
    issues.push({
      key: 'missing_guest_flag',
      label: 'Missing Guest Flag',
    })
  }

  if (
    user.number &&
    !user.phone
  ) {
    issues.push({
      key: 'missing_phone',
      label: 'Missing Phone',
    })
  }

  if (
    user.number &&
    !user.phoneE164
  ) {
    issues.push({
      key: 'missing_phone_e164',
      label: 'Missing PhoneE164',
    })
  }

  if (
    user.number &&
    !user.phoneSearch
  ) {
    issues.push({
      key: 'missing_phone_search',
      label: 'Missing PhoneSearch',
    })
  }

  if (
    !user.countryCode &&
    user.number &&
    user.number.startsWith('+')
  ) {
    issues.push({
      key: 'legacy_unsplit_number',
      label: 'Legacy Unsplit Number',
    })
  }
  if (
    user.isGuest === false &&
    !user.number &&
    !user.phone &&
    !user.phoneE164
  ) {
    issues.push({
      key: 'registered_without_contact',
      label: 'Registered Without Contact Info',
    })
  }

  if (
    user.isGuest === true &&
    (
      user.number ||
      user.phone ||
      user.phoneE164
    )
  ) {
    issues.push({
      key: 'guest_with_contact',
      label: 'Guest Has Contact Info',
    })
  }

  return issues
}
export function getSuggestedUserType(user) {
  // Strongest signal

  if (
    user.number ||
    user.phone ||
    user.phoneE164
  ) {
    return 'registered'
  }

  // Guest account signals

  if (
    user.username?.startsWith('guest_')
  ) {
    return 'guest'
  }

  return 'unknown'
}

export function getSuggestedFix(user) {
  const updates = {}

  const suggestedType =
    getSuggestedUserType(user)

  if (
    user.isGuest !== true &&
    user.isGuest !== false
  ) {
    if (suggestedType === 'guest') {
      updates.isGuest = true
    }

    if (suggestedType === 'registered') {
      updates.isGuest = false
    }
  }

  // Legacy accounts: `number` already holds a full E.164 value (starts
  // with "+") because it was written before countryCode/number were
  // split apart. Split it via a longest-prefix match against the known
  // dial codes so the phone/phoneE164/phoneSearch derivation below can
  // still fire in the same pass. Always double-check `updates.number`
  // against the actual dial-code prefix before applying, given the NANP
  // ambiguity (+1 vs +1868 etc.) this split is based on a best-effort
  // longest match, not a guarantee.
  let effectiveCountryCode = user.countryCode
  let effectiveNumber = user.number

  if (!user.countryCode && user.number && user.number.startsWith('+')) {
    const split = splitLegacyNumber(user.number)
    if (split) {
      updates.countryCode = split.countryCode
      updates.number = split.number
      effectiveCountryCode = split.countryCode
      effectiveNumber = split.number
    }
  }

  if (
    suggestedType === 'registered' &&
    effectiveNumber &&
    effectiveCountryCode
  ) {
    const phone =
      `${effectiveCountryCode}${effectiveNumber}`

    if (!user.phone) {
      updates.phone = phone
    }

    if (!user.phoneE164) {
      updates.phoneE164 = phone
    }

    if (!user.phoneSearch) {
      updates.phoneSearch =
        phone.replace('+', '')
    }
  }
  if (
    user.isGuest === false &&
    !user.number &&
    !user.phone &&
    !user.phoneE164
  ) {
    updates.isGuest = true
  }

  if (
    user.isGuest === true &&
    (
      user.number ||
      user.phone ||
      user.phoneE164
    )
  ) {
    updates.isGuest = false
  }

  return updates
}

// folders should always carry these as explicit booleans
const VISIBILITY_FLAGS = [
  'isFavourite',
  'isHidden',
  'isPublic',
]

// links use PascalCase status flags (set by the fix-field-casing /
// add-status-fields migrations) - links have no isFavourite or isPublic field
const LINK_STATUS_FLAGS = [
  'IsDeleted',
  'IsHidden',
]

// folders_audience documents must have these as explicit booleans so the
// mobile app's .where("isDeleted","==",false) / .where("isHidden","==",false)
// queries can include the document
const FOLDER_AUDIENCE_FLAGS = [
  'isDeleted',
  'isHidden',
]

function isMissingFlag(value) {
  return value !== true && value !== false
}

export function getFolderIssues(folder, audienceFolderIds) {
  const issues = []

  if (folder.storedId !== folder.id) {
    issues.push({
      key: 'invalid_id_field',
      label: 'Missing/Invalid id Field',
    })
  }

  if (!audienceFolderIds.has(folder.id)) {
    issues.push({
      key: 'missing_audience_mapping',
      label: 'Missing Audience Mapping',
    })
  }

  VISIBILITY_FLAGS.forEach(field => {
    if (isMissingFlag(folder[field])) {
      issues.push({
        key: `missing_${field}`,
        label: `Missing ${field}`,
      })
    }
  })

  return issues
}

export function getFolderSuggestedFix(folder) {
  const updates = {}

  if (folder.storedId !== folder.id) {
    updates.id = folder.id
  }

  VISIBILITY_FLAGS.forEach(field => {
    if (isMissingFlag(folder[field])) {
      updates[field] = false
    }
  })

  return updates
}

export function getLinkIssues(link) {
  const issues = []

  if (link.storedId !== link.id) {
    issues.push({
      key: 'invalid_id_field',
      label: 'Missing/Invalid id Field',
    })
  }

  LINK_STATUS_FLAGS.forEach(field => {
    if (isMissingFlag(link[field])) {
      issues.push({
        key: `missing_${field}`,
        label: `Missing ${field}`,
      })
    }
  })

  return issues
}

export function getLinkSuggestedFix(link) {
  const updates = {}

  if (link.storedId !== link.id) {
    updates.id = link.id
  }

  LINK_STATUS_FLAGS.forEach(field => {
    if (isMissingFlag(link[field])) {
      updates[field] = false
    }
  })

  return updates
}

export function getFolderAudienceIssues(audienceDoc) {
  const issues = []

  FOLDER_AUDIENCE_FLAGS.forEach(field => {
    if (isMissingFlag(audienceDoc[field])) {
      issues.push({
        key: `missing_${field}`,
        label: `Missing ${field}`,
      })
    }
  })

  return issues
}

export function getFolderAudienceSuggestedFix(audienceDoc) {
  const updates = {}

  FOLDER_AUDIENCE_FLAGS.forEach(field => {
    if (isMissingFlag(audienceDoc[field])) {
      updates[field] = false
    }
  })

  return updates
}