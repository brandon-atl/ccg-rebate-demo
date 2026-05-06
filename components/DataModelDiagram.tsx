"use client";

import { motion } from "framer-motion";

type Field = { name: string; type: string; pk?: boolean; fk?: boolean };

type Entity = {
  id: string;
  name: string;
  layer: "bronze" | "silver" | "gold" | "feedback";
  x: number;
  y: number;
  w: number;
  fields: Field[];
};

type Edge = { from: string; to: string; label?: string };

const layerStyle: Record<Entity["layer"], { headBg: string; headText: string; bodyBg: string; ring: string; pill: string }> = {
  bronze: { headBg: "#7C2D12", headText: "#fff", bodyBg: "#FFF7ED", ring: "#FED7AA", pill: "bronze · raw fact" },
  silver: { headBg: "#475569", headText: "#fff", bodyBg: "#F8FAFC", ring: "#CBD5E1", pill: "silver · conformed dim" },
  gold:   { headBg: "#92400E", headText: "#fff", bodyBg: "#FFFBEB", ring: "#FCD34D", pill: "gold · semantic" },
  feedback: { headBg: "#1F2937", headText: "#fff", bodyBg: "#F1F5F9", ring: "#94A3B8", pill: "feedback loop" },
};

const ROW_H = 17;
const HEAD_H = 26;
const PAD_BOTTOM = 6;

function entityHeight(e: Entity) {
  return HEAD_H + e.fields.length * ROW_H + PAD_BOTTOM;
}

const entities: Entity[] = [
  // Bronze
  {
    id: "fact_transaction",
    name: "fact_transaction",
    layer: "bronze",
    x: 24, y: 28, w: 232,
    fields: [
      { name: "transaction_id", type: "BIGSERIAL", pk: true },
      { name: "netsuite_txn_id", type: "TEXT" },
      { name: "shop_id", type: "INT", fk: true },
      { name: "vendor_id", type: "INT", fk: true },
      { name: "product_id", type: "INT", fk: true },
      { name: "transaction_date", type: "DATE" },
      { name: "transaction_type", type: "TEXT" },
      { name: "gross_amount", type: "NUMERIC" },
    ],
  },
  {
    id: "fact_rebate_claim",
    name: "fact_rebate_claim",
    layer: "bronze",
    x: 24, y: 240, w: 232,
    fields: [
      { name: "claim_id", type: "BIGSERIAL", pk: true },
      { name: "transaction_id", type: "BIGINT", fk: true },
      { name: "program_id", type: "INT", fk: true },
      { name: "claim_status", type: "TEXT" },
      { name: "claimed_amount", type: "NUMERIC" },
      { name: "claim_date", type: "DATE" },
    ],
  },
  // Silver
  {
    id: "dim_shop",
    name: "dim_shop",
    layer: "silver",
    x: 320, y: 14, w: 208,
    fields: [
      { name: "shop_id", type: "INT", pk: true },
      { name: "shop_code", type: "TEXT" },
      { name: "shop_name", type: "TEXT" },
      { name: "region", type: "TEXT" },
      { name: "state", type: "TEXT" },
      { name: "affiliate_tier", type: "TEXT" },
      { name: "volume_tier", type: "TEXT" },
      { name: "drp_mix", type: "TEXT" },
      { name: "certification_level", type: "TEXT" },
    ],
  },
  {
    id: "dim_vendor",
    name: "dim_vendor",
    layer: "silver",
    x: 320, y: 220, w: 208,
    fields: [
      { name: "vendor_id", type: "INT", pk: true },
      { name: "vendor_code", type: "TEXT" },
      { name: "vendor_name", type: "TEXT" },
      { name: "parent_vendor_code", type: "TEXT" },
      { name: "parent_vendor_name", type: "TEXT" },
      { name: "vendor_category", type: "TEXT" },
    ],
  },
  {
    id: "dim_product",
    name: "dim_product",
    layer: "silver",
    x: 320, y: 366, w: 208,
    fields: [
      { name: "product_id", type: "INT", pk: true },
      { name: "sku", type: "TEXT" },
      { name: "product_category", type: "TEXT" },
      { name: "eligible_default", type: "BOOL" },
    ],
  },
  {
    id: "dim_program",
    name: "dim_program",
    layer: "silver",
    x: 320, y: 478, w: 208,
    fields: [
      { name: "program_id", type: "INT", pk: true },
      { name: "program_code", type: "TEXT" },
      { name: "parent_vendor_code", type: "TEXT", fk: true },
      { name: "eligible_category", type: "TEXT" },
      { name: "rebate_rate", type: "NUMERIC" },
      { name: "start_date / end_date", type: "DATE" },
    ],
  },
  // Gold
  {
    id: "vw_rebate_gold",
    name: "vw_rebate_gold",
    layer: "gold",
    x: 596, y: 100, w: 244,
    fields: [
      { name: "(joins all bronze + silver)", type: "" },
      { name: "maturity_days", type: "INT" },
      { name: "expected_rebate_amount", type: "NUMERIC" },
      { name: "leakage_flag", type: "BOOL" },
      { name: "leakage_reason", type: "TEXT" },
      { name: "root_cause", type: "TEXT" },
      { name: "priority_level", type: "TEXT" },
      { name: "vendor_crosswalk_used", type: "BOOL" },
    ],
  },
  // Feedback
  {
    id: "fact_bi_followup",
    name: "fact_bi_followup",
    layer: "feedback",
    x: 596, y: 380, w: 244,
    fields: [
      { name: "followup_id", type: "BIGSERIAL", pk: true },
      { name: "transaction_id", type: "BIGINT", fk: true },
      { name: "program_id", type: "INT", fk: true },
      { name: "followup_status", type: "TEXT" },
      { name: "owner / updated_at", type: "TEXT/TS" },
    ],
  },
];

const edges: Edge[] = [
  { from: "fact_transaction", to: "dim_shop", label: "shop_id" },
  { from: "fact_transaction", to: "dim_vendor", label: "vendor_id" },
  { from: "fact_transaction", to: "dim_product", label: "product_id" },
  { from: "dim_program", to: "dim_vendor", label: "parent_vendor_code" },
  { from: "fact_rebate_claim", to: "fact_transaction", label: "transaction_id" },
  { from: "fact_rebate_claim", to: "dim_program", label: "program_id" },
  { from: "fact_transaction", to: "vw_rebate_gold" },
  { from: "fact_rebate_claim", to: "vw_rebate_gold" },
  { from: "dim_shop", to: "vw_rebate_gold" },
  { from: "dim_vendor", to: "vw_rebate_gold" },
  { from: "dim_product", to: "vw_rebate_gold" },
  { from: "dim_program", to: "vw_rebate_gold" },
  { from: "fact_bi_followup", to: "vw_rebate_gold", label: "feedback loop" },
];

function entityCenter(e: Entity) {
  return { cx: e.x + e.w / 2, cy: e.y + entityHeight(e) / 2 };
}

function nearestEdge(from: Entity, to: Entity) {
  // Connect on the side of "from" that faces "to", at the vertical center.
  const fromRight = from.x + from.w < to.x;
  const fx = fromRight ? from.x + from.w : from.x;
  const tx = fromRight ? to.x : to.x + to.w;
  const fy = entityCenter(from).cy;
  const ty = entityCenter(to).cy;
  return { fx, fy, tx, ty };
}

export function DataModelDiagram() {
  const W = 880;
  const H = 640;
  const byId = Object.fromEntries(entities.map((e) => [e.id, e]));

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        className="block"
        style={{ minWidth: 720 }}
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="#94A3B8" />
          </marker>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0 L0 0 0 20" fill="none" stroke="#EFEAE0" strokeWidth="1" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={W} height={H} fill="url(#grid)" opacity="0.55" />

        {/* Layer columns */}
        <g>
          {[
            { x: 24, w: 232, label: "BRONZE · RAW LANDING" },
            { x: 320, w: 208, label: "SILVER · CONFORMED MODEL" },
            { x: 596, w: 244, label: "GOLD · SEMANTIC + FEEDBACK" },
          ].map((col) => (
            <text
              key={col.label}
              x={col.x}
              y={14}
              fontFamily="'Segoe UI', sans-serif"
              fontSize="9.5"
              letterSpacing="1.4"
              fill="#94A3B8"
              fontWeight="600"
            >
              {col.label}
            </text>
          ))}
        </g>

        {/* Edges */}
        {edges.map((edge, i) => {
          const from = byId[edge.from];
          const to = byId[edge.to];
          if (!from || !to) return null;
          const { fx, fy, tx, ty } = nearestEdge(from, to);
          const midX = (fx + tx) / 2;
          const path = `M ${fx} ${fy} C ${midX} ${fy}, ${midX} ${ty}, ${tx} ${ty}`;
          return (
            <motion.g
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.03 }}
            >
              <path d={path} fill="none" stroke="#CBD5E1" strokeWidth="1.2" markerEnd="url(#arrow)" />
              {edge.label ? (
                <text
                  x={midX}
                  y={(fy + ty) / 2 - 4}
                  fontFamily="'Cascadia Mono', monospace"
                  fontSize="9"
                  fill="#94A3B8"
                  textAnchor="middle"
                >
                  {edge.label}
                </text>
              ) : null}
            </motion.g>
          );
        })}

        {/* Entities */}
        {entities.map((e, idx) => {
          const style = layerStyle[e.layer];
          const h = entityHeight(e);
          return (
            <motion.g
              key={e.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <rect
                x={e.x}
                y={e.y}
                width={e.w}
                height={h}
                rx="4"
                ry="4"
                fill={style.bodyBg}
                stroke={style.ring}
                strokeWidth="1"
              />
              <rect x={e.x} y={e.y} width={e.w} height={HEAD_H} rx="4" ry="4" fill={style.headBg} />
              <rect x={e.x} y={e.y + HEAD_H - 6} width={e.w} height="6" fill={style.headBg} />
              <text
                x={e.x + 10}
                y={e.y + 17}
                fontFamily="'Cascadia Mono', monospace"
                fontSize="11.5"
                fontWeight="600"
                fill={style.headText}
              >
                {e.name}
              </text>
              {e.fields.map((f, i) => (
                <g key={f.name}>
                  <text
                    x={e.x + 10}
                    y={e.y + HEAD_H + (i + 1) * ROW_H - 5}
                    fontFamily="'Cascadia Mono', monospace"
                    fontSize="10"
                    fill="#1F2937"
                  >
                    {f.pk ? "🔑 " : f.fk ? "↗ " : "  "}
                    {f.name}
                  </text>
                  {f.type ? (
                    <text
                      x={e.x + e.w - 10}
                      y={e.y + HEAD_H + (i + 1) * ROW_H - 5}
                      fontFamily="'Cascadia Mono', monospace"
                      fontSize="9"
                      fill="#94A3B8"
                      textAnchor="end"
                    >
                      {f.type}
                    </text>
                  ) : null}
                </g>
              ))}
            </motion.g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(24, ${H - 26})`}>
          {[
            { label: "Bronze", fill: "#7C2D12" },
            { label: "Silver", fill: "#475569" },
            { label: "Gold", fill: "#92400E" },
            { label: "Feedback", fill: "#1F2937" },
          ].map((l, i) => (
            <g key={l.label} transform={`translate(${i * 92}, 0)`}>
              <rect width="10" height="10" rx="2" fill={l.fill} />
              <text x="14" y="9" fontSize="10" fill="#475569" fontFamily="'Segoe UI', sans-serif">
                {l.label}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
