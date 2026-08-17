import { getOrCreateReferralCode, getReferralStats } from "@/lib/actions/referrals";
import { ReferralLink } from "./referral-link";

export default async function ParrainagePage() {
  await getOrCreateReferralCode();
  const { code, count } = await getReferralStats();

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Parrainage</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Partagez votre lien avec un autre artisan ou commerçant. La récompense pour vous deux
        sera annoncée bientôt — en attendant, chaque inscription via votre lien compte.
      </p>

      {code && <ReferralLink code={code} />}

      <p className="mt-6 text-sm text-ink-soft">
        <span className="font-bold text-ink">{count}</span> filleul{count > 1 ? "s" : ""} inscrit{count > 1 ? "s" : ""} via votre lien.
      </p>
    </div>
  );
}
