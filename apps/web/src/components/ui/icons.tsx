// Icons — FontAwesome 6 solid, re-exported under the names the app already uses.
//
// WHY THIS FILE EXISTS
// The approved visual reference (planning/demo-ui) uses FontAwesome **solid**:
// filled, heavy glyphs. The first build used Lucide, whose 2px outline strokes read
// as noticeably thinner and weaker at the same size. The owner reviewed both and
// chose the demo's icons, and amended the Icons row in AGENTS.md accordingly.
//
// Each icon is exported under its previous Lucide name, so pages only change their
// import source — no JSX edits, no prop churn across 27 files, and swapping icon
// libraries again later is a one-file change.
//
// NOTE ON PROPS: react-icons accepts `size` and `className` exactly like Lucide, so
// existing call sites keep working. `strokeWidth` is meaningless on a filled glyph;
// it is accepted (it is a valid SVG attribute) and simply has no effect. Leaving it
// in place is harmless — do not churn files just to strip it.
//
// Where the demo used a specific glyph, that glyph wins. The mapping is annotated
// with the demo's original class so the provenance is checkable.
export {
  // ── Present in planning/demo-ui ────────────────────────────────────────────
  FaArrowLeft as ArrowLeft, //            fa-arrow-left
  FaCamera as Camera, //                  fa-camera
  FaCarSide as Car, //                    fa-car-side (demo hero) / fa-car (nav)
  FaCheck as Check, //                    fa-check
  FaCircleCheck as CheckCircle, //        fa-circle-check
  FaCircleCheck as CheckCircle2, //       fa-circle-check
  FaGear as Settings, //                  fa-gear
  FaHouse as Home, //                     fa-house
  FaMagnifyingGlass as Search, //         fa-magnifying-glass
  FaPlus as Plus, //                      fa-plus
  FaPrint as Printer, //                  fa-print
  FaQrcode as QrCode, //                  fa-qrcode
  FaReceipt as Receipt, //                fa-receipt
  FaRotateRight as RefreshCw, //          fa-rotate-right
  FaTriangleExclamation as AlertTriangle, // fa-triangle-exclamation
  FaUser as User, //                      fa-user
  FaUsers as Users, //                    fa-users
  FaFileInvoiceDollar as FileText, //     fa-file-invoice-dollar (New Estimate)

  // ── No demo equivalent: nearest FontAwesome solid ─────────────────────────
  FaArrowRight as ArrowRight,
  FaBuilding as Building2,
  FaCalendarDays as CalendarDays,
  FaChevronDown as ChevronDown,
  FaChevronRight as ChevronRight,
  FaCircleExclamation as AlertCircle,
  FaCircleXmark as XCircle,
  FaClock as Clock,
  FaCopy as Copy,
  FaCreditCard as CreditCard,
  FaEnvelope as Mail,
  FaFileArrowDown as FileDown,
  FaFloppyDisk as Save,
  FaHashtag as Hash,
  FaImages as ImagePlus,
  FaIndianRupeeSign as IndianRupee,
  FaLink as Link2,
  FaLocationArrow as Navigation,
  FaLocationDot as MapPin,
  FaMapLocationDot as MapPinned,
  FaMobileScreen as Smartphone,
  FaMoneyBillWave as Banknote,
  FaPen as Edit3,
  FaPercent as Percent,
  FaPhone as Phone,
  FaQrcode as ScanLine, //                the "scan this code" affordance
  FaRightFromBracket as LogOut,
  FaRightToBracket as LogIn,
  FaShareNodes as Share2,
  FaShieldHalved as Shield,
  FaSpinner as Loader2, //                pair with `animate-spin-fast`
  FaToggleOff as ToggleLeft,
  FaToggleOn as ToggleRight,
  FaTrash as Trash2,
  FaTruck as Truck,
  FaWallet as Wallet,
  FaWrench as Wrench,
  FaXmark as X, //                        close / dismiss affordance
} from 'react-icons/fa6'
