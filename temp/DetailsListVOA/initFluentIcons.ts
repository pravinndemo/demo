/* eslint-disable @typescript-eslint/no-unsafe-call */
// Initialize Fluent UI MDL2 font icons once per runtime so icon names like
// 'SortUp', 'SortDown', and 'Filter' render correctly in menus and headers.
// Using the v8-compatible initializer from @fluentui/react.
// If your environment prefers the dedicated package, you can switch to
// `@fluentui/font-icons-mdl2`.
import { initializeIcons } from '@fluentui/react/lib/Icons';

initializeIcons();
