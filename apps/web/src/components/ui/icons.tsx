// Icons — Lucide, via react-icons/lu, re-exported under the names the app uses.
//
// WHY THIS FILE EXISTS
// planning/design_handoff_autro_ui (the current visual reference — see
// DESIGN.md) draws every icon as a 2px-stroke, round-cap outline glyph —
// literally Lucide's own path style. The app previously used FontAwesome
// **solid** (filled, heavy) glyphs, chosen against an earlier demo that no
// longer governs the design. Switched back to match the current handoff.
//
// Each icon is exported under the same semantic name as before, so pages only
// change their import source when a name is actually wrong for its icon (see
// the vehicles/add.tsx Camera→Car/Save fix) — no wide JSX churn. Swapping
// icon libraries again later is still a one-file change.
//
// NOTE ON PROPS: react-icons accepts `size`, `className` and `strokeWidth`
// identically across its sets, so existing call sites keep working — Lucide
// glyphs actually use strokeWidth (FontAwesome's filled glyphs ignored it).
export {
  LuArrowLeft as ArrowLeft,
  LuCamera as Camera,
  LuCar as Car,
  LuCheck as Check,
  LuCircleCheck as CheckCircle,
  LuCircleCheck as CheckCircle2,
  LuSettings as Settings,
  LuHouse as Home,
  LuSearch as Search,
  LuPlus as Plus,
  LuPrinter as Printer,
  LuQrCode as QrCode,
  LuReceipt as Receipt,
  LuRotateCw as RefreshCw,
  LuTriangleAlert as AlertTriangle,
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
  LuHash as Hash,
  LuImagePlus as ImagePlus,
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
  LuTruck as Truck,
  LuWallet as Wallet,
  LuWrench as Wrench,
  LuX as X, //                          close / dismiss affordance
} from 'react-icons/lu'
