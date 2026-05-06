"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";

export type FollowupStatus =
  | "new"
  | "in_progress"
  | "claimed"
  | "unclaimable"
  | "false_positive";

export type GroupKey = {
  shop_code: string;
  parent_vendor_name: string;
  program_name: string;
  leakage_reason: string;
};

export async function updateGroupFollowup(
  groupKey: GroupKey,
  status: FollowupStatus
) {
  await query(
    `
    INSERT INTO fact_bi_followup (transaction_id, program_id, followup_status, owner, updated_at)
    SELECT g.transaction_id, g.program_id, $5::TEXT, 'demo-user', NOW()
    FROM vw_rebate_gold g
    WHERE g.shop_code = $1
      AND g.parent_vendor_name = $2
      AND g.program_name = $3
      AND g.leakage_reason = $4
    ON CONFLICT (transaction_id, program_id)
    DO UPDATE SET followup_status = EXCLUDED.followup_status, updated_at = NOW();
    `,
    [
      groupKey.shop_code,
      groupKey.parent_vendor_name,
      groupKey.program_name,
      groupKey.leakage_reason,
      status,
    ]
  );
  revalidatePath("/action-list");
  revalidatePath("/");
}
