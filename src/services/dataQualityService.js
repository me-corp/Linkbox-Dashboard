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

  if (
    suggestedType === 'registered' &&
    user.number &&
    user.countryCode
  ) {
    const phone =
      `${user.countryCode}${user.number}`

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