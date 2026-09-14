import {
  Home,
  Flag,
  CircleDot,
  Users,
  User,
  Wifi,
  BatteryFull,
} from "lucide-react";
import s from "./member-preview.module.css";

/** Static product illustration; values and course name are sample data. */
export function MemberHomePreview({ className = "" }: { className?: string }) {
  return (
    <div
      className={`${s.preview} ${className}`}
      role="img"
      aria-label="TeeAhead member home preview with sample data: Riley has 2,140 Fairway Points and an upcoming round."
    >
      <div className={s.screen} aria-hidden="true">
        <div className={s.top}>
          <div className={s.status}>
            <span>9:41</span>
            <span>
              <Wifi />
              <BatteryFull />
            </span>
          </div>
          <p className={s.date}>Saturday, May 24</p>
          <div className={s.greeting}>
            <h3>Morning, Riley.</h3>
            <span>EAGLE</span>
          </div>
          <div className={s.points}>
            <p>FAIRWAY POINTS</p>
            <div className={s.balance}>
              2,140 <span>points</span>
            </div>
            <div className={s.progress}>
              <span />
            </div>
            <small>Your next round is another step closer.</small>
          </div>
        </div>
        <div className={s.body}>
          <div className={s.label}>YOUR NEXT ROUND</div>
          <div className={s.booking}>
            <div className={s.bookingTitle}>
              <strong>Plum Hollow</strong>
              <span>$46</span>
            </div>
            <p>Today · 9:40 AM · Foursome</p>
            <div className={s.bookingActions}>
              <span>Add to wallet</span>
              <span>Check in →</span>
            </div>
          </div>
          <div className={s.recentTitle}>
            <span>RECENT ROUNDS</span>
            <span>View all →</span>
          </div>
          {[
            ["Plum Hollow", "May 17 · $46", "+46"],
            ["Western Acres", "May 10 · $52", "+52"],
            ["Cattails", "May 3 · $48", "+48"],
          ].map(([name, date, points]) => (
            <div className={s.round} key={name}>
              <div>
                <strong>{name}</strong>
                <small>{date}</small>
              </div>
              <span>
                {points}
                <small>POINTS</small>
              </span>
            </div>
          ))}
        </div>
        <div className={s.navigation}>
          {[
            [Home, "Home"],
            [Flag, "Book"],
            [CircleDot, "Points"],
            [Users, "Partners"],
            [User, "Profile"],
          ].map(([Icon, label]) => {
            const NavIcon = Icon as typeof Home;
            return (
              <div key={label as string}>
                <NavIcon />
                <span>{label as string}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
