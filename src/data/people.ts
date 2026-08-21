import type { User } from '@/types';

export const PEOPLE: Record<string, User> = {
  dana: { id: 'dana', name: 'Dana Whitlock', email: 'dana@whitlock.dev', initials: 'DW', isSuperadmin: true },
  sam: { id: 'sam', name: 'Sam Oyelaran', email: 'sam@northwind.co', initials: 'SO' },
  priya: { id: 'priya', name: 'Priya Raman', email: 'priya@northwind.co', initials: 'PR' },
  jonas: { id: 'jonas', name: 'Jonas Kettil', email: 'jonas@northwind.co', initials: 'JK' },
  tess: { id: 'tess', name: 'Tess Abara', email: 'tess@contract.io', initials: 'TA' },
  marco: { id: 'marco', name: 'Marco Oduya', email: 'marco@mossco.com', initials: 'MO' },
  ruth: { id: 'ruth', name: 'Ruth Lindqvist', email: 'ruth@mossco.com', initials: 'RL' },
};

export const CURRENT_USER_ID = 'dana';

export const PRIORITY_CODE: Record<string, string> = { Urgent: 'P1', High: 'P2', Medium: 'P3', Low: 'P4' };

export const STORE_KIND_LABEL: Record<string, string> = { ENV: 'Env file', DOC: 'Doc', LINK: 'Link', NOTE: 'Note' };
