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