export const PERMISSIONS = {
  // Analytics
  ANALYTICS_OVERVIEW:    'analytics:overview:view',
  ANALYTICS_GROWTH:      'analytics:growth:view',
  ANALYTICS_RETENTION:   'analytics:retention:view',
  ANALYTICS_ENGAGEMENT:  'analytics:engagement:view',
  ANALYTICS_POWER_USERS: 'analytics:power_users:view',

  // Feature Insights — a growing collection of smaller, feature-specific
  // insight panels (one tab each) that don't warrant their own top-level
  // analytics page. Add one leaf permission per new panel/tab here.
  INSIGHTS_GUEST_CONVERSION: 'insights:guest_conversion:view',
  INSIGHTS_LOGIN_SCREEN: 'insights:login_screen:view',

  // Stale Users
  STALE_USERS_INSIGHTS:     'stale_users:insights:view',
  STALE_USERS_TABLE:        'stale_users:table:view',
  STALE_USERS_USER_DETAILS: 'stale_users:user_details:view',

  // Users
  USERS_TABLE:        'users:table:view',
  USERS_USER_DETAILS: 'users:user_details:view',

  // Data Integrity
  DI_FOLDERS_VIEW:          'data_integrity:folders:view',
  DI_FOLDERS_FIX:           'data_integrity:folders:fix',
  DI_LINKS_VIEW:            'data_integrity:links:view',
  DI_LINKS_FIX:             'data_integrity:links:fix',
  DI_FOLDER_AUDIENCE_VIEW:  'data_integrity:folder_audience:view',
  DI_FOLDER_AUDIENCE_FIX:   'data_integrity:folder_audience:fix',
  DI_LINK_PREVIEWS_VIEW:    'data_integrity:link_previews:view',
  DI_LINK_PREVIEWS_FETCH:   'data_integrity:link_previews:fetch',
  DI_MIGRATIONS_VIEW:       'data_integrity:migrations:view',
  DI_MIGRATIONS_RUN:        'data_integrity:migrations:run',

  // Submissions
  SUBMISSIONS_CREATOR_APPS_VIEW:    'submissions:creator_applications:view',
  SUBMISSIONS_CREATOR_APPS_RESPOND: 'submissions:creator_applications:respond',
  SUBMISSIONS_PINGME_VIEW:          'submissions:pingme_waitlist:view',
  SUBMISSIONS_PINGME_RESPOND:       'submissions:pingme_waitlist:respond',
  SUBMISSIONS_NEWSLETTER_VIEW:      'submissions:newsletter:view',
  SUBMISSIONS_FEEDBACK_VIEW:        'submissions:feedback:view',
  SUBMISSIONS_FEEDBACK_RESPOND:     'submissions:feedback:respond',
  SUBMISSIONS_HELP_VIEW:            'submissions:help_requests:view',
  SUBMISSIONS_HELP_RESPOND:         'submissions:help_requests:respond',
  SUBMISSIONS_ACTIVITY_LOGS_VIEW:   'submissions:activity_logs:view',

  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
}

// Grouped for the permissions UI in TeamSettingsView
export const PERMISSION_GROUPS = [
  {
    key: 'analytics',
    label: 'Analytics',
    items: [
      { label: 'Overview',    perm: PERMISSIONS.ANALYTICS_OVERVIEW },
      { label: 'Growth',      perm: PERMISSIONS.ANALYTICS_GROWTH },
      { label: 'Retention',   perm: PERMISSIONS.ANALYTICS_RETENTION },
      { label: 'Engagement',  perm: PERMISSIONS.ANALYTICS_ENGAGEMENT },
      { label: 'Power Users', perm: PERMISSIONS.ANALYTICS_POWER_USERS },
    ],
  },
  {
    key: 'insights',
    label: 'Feature Insights',
    items: [
      { label: 'Guest Conversion', perm: PERMISSIONS.INSIGHTS_GUEST_CONVERSION },
      { label: 'Login Screen', perm: PERMISSIONS.INSIGHTS_LOGIN_SCREEN },
    ],
  },
  {
    key: 'stale_users',
    label: 'Stale Users',
    items: [
      { label: 'Insights',     perm: PERMISSIONS.STALE_USERS_INSIGHTS },
      { label: 'Table',        perm: PERMISSIONS.STALE_USERS_TABLE },
      { label: 'User Details', perm: PERMISSIONS.STALE_USERS_USER_DETAILS },
    ],
  },
  {
    key: 'users',
    label: 'Users',
    items: [
      { label: 'Table',        perm: PERMISSIONS.USERS_TABLE },
      { label: 'User Details', perm: PERMISSIONS.USERS_USER_DETAILS },
    ],
  },
  {
    key: 'data_integrity',
    label: 'Data Integrity',
    items: [
      { label: 'Folders — View',         perm: PERMISSIONS.DI_FOLDERS_VIEW },
      { label: 'Folders — Fix',          perm: PERMISSIONS.DI_FOLDERS_FIX },
      { label: 'Links — View',           perm: PERMISSIONS.DI_LINKS_VIEW },
      { label: 'Links — Fix',            perm: PERMISSIONS.DI_LINKS_FIX },
      { label: 'Folder Audience — View', perm: PERMISSIONS.DI_FOLDER_AUDIENCE_VIEW },
      { label: 'Folder Audience — Fix',  perm: PERMISSIONS.DI_FOLDER_AUDIENCE_FIX },
      { label: 'Link Previews — View',   perm: PERMISSIONS.DI_LINK_PREVIEWS_VIEW },
      { label: 'Link Previews — Fetch',  perm: PERMISSIONS.DI_LINK_PREVIEWS_FETCH },
      { label: 'Migrations — View',      perm: PERMISSIONS.DI_MIGRATIONS_VIEW },
      { label: 'Migrations — Run',       perm: PERMISSIONS.DI_MIGRATIONS_RUN },
    ],
  },
  {
    key: 'submissions',
    label: 'Submissions',
    items: [
      { label: 'Creator Applications — View',    perm: PERMISSIONS.SUBMISSIONS_CREATOR_APPS_VIEW },
      { label: 'Creator Applications — Respond', perm: PERMISSIONS.SUBMISSIONS_CREATOR_APPS_RESPOND },
      { label: 'PingMe Waitlist — View',         perm: PERMISSIONS.SUBMISSIONS_PINGME_VIEW },
      { label: 'PingMe Waitlist — Respond',      perm: PERMISSIONS.SUBMISSIONS_PINGME_RESPOND },
      { label: 'Newsletter — View',              perm: PERMISSIONS.SUBMISSIONS_NEWSLETTER_VIEW },
      { label: 'Feedback — View',                perm: PERMISSIONS.SUBMISSIONS_FEEDBACK_VIEW },
      { label: 'Feedback — Respond',             perm: PERMISSIONS.SUBMISSIONS_FEEDBACK_RESPOND },
      { label: 'Help Requests — View',           perm: PERMISSIONS.SUBMISSIONS_HELP_VIEW },
      { label: 'Help Requests — Respond',        perm: PERMISSIONS.SUBMISSIONS_HELP_RESPOND },
      { label: 'Activity Logs — View',           perm: PERMISSIONS.SUBMISSIONS_ACTIVITY_LOGS_VIEW },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    items: [
      { label: 'View', perm: PERMISSIONS.SETTINGS_VIEW },
      { label: 'Edit', perm: PERMISSIONS.SETTINGS_EDIT },
    ],
  },
]
