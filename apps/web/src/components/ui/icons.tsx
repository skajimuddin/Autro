// Icons — Lucide, via react-icons/lu, re-exported under the names the app uses.
//
// SCOPE: this file serves the screens still rendered with Tailwind. Screens
// migrated to MUI (the dashboard and the vehicle screens) import from
// @mui/icons-material instead, matching the icon set the approved design was
// drawn with — see DESIGN.md. This file shrinks as screens migrate and goes
// away with the last one, so nothing here should gain new entries.
//
// NOTE ON PROPS: react-icons accepts `size`, `className` and `strokeWidth`
// identically across its sets, so call sites are uniform.
export {
  LuCheck as Check,
  LuCircleCheck as CheckCircle,
  LuCircleCheck as CheckCircle2,
  LuPlus as Plus,
  LuPrinter as Printer,
  LuQrCode as QrCode,
  // Lucide's `receipt` draws a literal dollar sign inside the receipt
  // (path "M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" + a vertical stroke).
  // Every amount in this app is ₹, so the rupee variant is the correct glyph —
  // same export name, so no call site changes. Swapped 2026-08-20.
  LuReceiptIndianRupee as Receipt,
  LuRotateCw as RefreshCw,
  LuUser as User,
  LuUsers as Users,
  LuFileText as FileText,
  LuArrowRight as ArrowRight,
  LuBuilding2 as Building2,
  LuCalendarDays as CalendarDays,
  LuChevronDown as ChevronDown,
  LuChevronRight as ChevronRight,
  LuCircleAlert as AlertCircle,
  LuCircleX as XCircle,
  LuClock as Clock,
  LuCopy as Copy,
  LuCreditCard as CreditCard,
  LuMail as Mail,
  LuFileDown as FileDown,
  LuSave as Save,
  LuIndianRupee as IndianRupee,
  LuLink2 as Link2,
  LuNavigation as Navigation,
  LuMapPin as MapPin,
  LuMapPinned as MapPinned,
  LuSmartphone as Smartphone,
  LuBanknote as Banknote,
  LuPenLine as Edit3,
  LuPercent as Percent,
  LuPhone as Phone,
  LuScanLine as ScanLine,
  LuLogOut as LogOut,
  LuLogIn as LogIn,
  LuShare2 as Share2,
  LuShield as Shield,
  LuLoaderCircle as Loader2, //          pair with `animate-spin-fast`
  LuToggleLeft as ToggleLeft,
  LuToggleRight as ToggleRight,
  LuTrash2 as Trash2,
  LuWallet as Wallet,
  LuX as X, //                          close / dismiss affordance
} from 'react-icons/lu'
