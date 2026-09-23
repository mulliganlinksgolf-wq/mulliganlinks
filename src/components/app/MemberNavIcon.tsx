import {
  House,
  Flag,
  CalendarDays,
  Users,
  Trophy,
  ArrowLeftRight,
  Coins,
  Gift,
  Contact,
  CreditCard,
  UserRound,
} from "lucide-react";
const icons = {
  "/app": House,
  "/app/courses": Flag,
  "/app/bookings": CalendarDays,
  "/app/partners": Users,
  "/app/leagues": Trophy,
  "/app/trading": ArrowLeftRight,
  "/app/points": Coins,
  "/app/benefits": Gift,
  "/app/card": Contact,
  "/app/billing": CreditCard,
  "/app/profile": UserRound,
};
export function MemberNavIcon({ href }: { href: string }) {
  const Icon = icons[href as keyof typeof icons] ?? House;
  return <Icon size={19} strokeWidth={1.6} aria-hidden="true" />;
}
