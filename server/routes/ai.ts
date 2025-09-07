import { RequestHandler } from "express";
import { getCurrentData } from "./upload";

// Simple text normalization
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

function isNumericColumn(data: any[], col: string) {
  let valid = 0;
  for (const row of data) {
    const v = row[col];
    if (v === null || v === undefined || v === "") continue;
    if (!isNaN(Number(v))) valid++;
  }
  return valid >= Math.max(3, Math.floor(data.length * 0.5));
}

function isDateColumn(data: any[], col: string) {
  let valid = 0;
  for (const row of data) {
    const v = row[col];
    if (!v) continue;
    const d = new Date(v);
    if (!isNaN(d.getTime())) valid++;
  }
  return valid >= Math.max(3, Math.floor(data.length * 0.5));
}

function topN<T>(arr: T[], n: number) {
  return arr.slice(0, Math.max(0, n));
}

function guessN(question: string) {
  const m = normalize(question).match(
    /\b(top|maiores|principais|top\s*)(\d{1,3})/,
  );
  if (m && m[2]) return Math.min(1000, parseInt(m[2], 10));
  const m2 = normalize(question).match(/\b(\d{1,3})\b/);
  if (m2) return Math.min(1000, parseInt(m2[1], 10));
  return 10;
}

function guessColumns(question: string, columns: string[]) {
  const q = normalize(question);
  const norms = columns.map((c) => ({ raw: c, n: normalize(c) }));

  const synonyms: Record<string, string[]> = {
    cliente: [
      "cliente",
      "clientes",
      "empresa",
      "empresas",
      "consumidor",
      "consumidores",
      "company",
      "customer",
      "client",
    ],
    produto: ["produto", "produtos", "product", "item", "sku", "artigo"],
    categoria: ["categoria", "segmento", "tipo", "classe", "grupo"],
    data: ["data", "date", "dt", "dia", "mes", "m\u00eas", "ano", "year"],
    valor: [
      "valor",
      "valor_total",
      "price",
      "preco",
      "pre\u00e7o",
      "amount",
      "total",
      "receita",
      "faturamento",
    ],
    quantidade: [
      "quantidade",
      "qtd",
      "volume",
      "count",
      "numero",
      "n\u00famero",
    ],
    processos: ["processo", "processos", "ordens", "orders", "tickets"],
  };

  const score = (name: string) => norms.find((c) => c.n.includes(name))?.raw;

  const result: Record<string, string | undefined> = {};
  for (const [key, syns] of Object.entries(synonyms)) {
    for (const s of syns) {
      if (q.includes(s)) {
        const col = score(s);
        if (col) {
          result[key] = col;
          break;
        }
      }
    }
  }

  // Try fuzzy by token overlap
  if (!result.cliente) {
    for (const c of norms)
      if (/[a-z]/.test(c.n) && q.includes(c.n)) {
        result.cliente = c.raw;
        break;
      }
  }

  return result;
}

function groupByCount(
  data: any[],
  key: string,
  filter?: { column: string; equals: string },
) {
  const map = new Map<string, number>();
  for (const row of data) {
    if (filter && String(row[filter.column]) !== filter.equals) continue;
    const k = String(row[key] ?? "");
    map.set(k, (map.get(k) || 0) + 1);
  }
  const rows = Array.from(map.entries()).map(([k, v]) => ({
    categoria: k,
    valor: v,
  }));
  rows.sort((a, b) => b.valor - a.valor);
  return rows;
}

function groupByAggregate(
  data: any[],
  key: string,
  valueField: string,
  op: "sum" | "avg",
) {
  const map = new Map<string, { sum: number; count: number }>();
  for (const row of data) {
    const k = String(row[key] ?? "");
    const v = Number(row[valueField]) || 0;
    const cur = map.get(k) || { sum: 0, count: 0 };
    cur.sum += v;
    cur.count += 1;
    map.set(k, cur);
  }
  const rows = Array.from(map.entries()).map(([k, { sum, count }]) => ({
    categoria: k,
    valor: op === "sum" ? sum : sum / (count || 1),
  }));
  rows.sort((a, b) => b.valor - a.valor);
  return rows;
}

function timeSeriesCount(
  data: any[],
  dateCol: string,
  unit: "month" | "year" | "day",
) {
  const bucket = (d: Date) => {
    const y = d.getFullYear();
    if (unit === "year") return `${y}`;
    const m = String(d.getMonth() + 1).padStart(2, "0");
    if (unit === "month") return `${y}-${m}`;
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const map = new Map<string, number>();
  for (const row of data) {
    const v = row[dateCol];
    const d = new Date(v);
    if (isNaN(d.getTime())) continue;
    const k = bucket(d);
    map.set(k, (map.get(k) || 0) + 1);
  }
  const rows = Array.from(map.entries()).map(([k, v]) => ({
    periodo: k,
    valor: v,
  }));
  rows.sort((a, b) => a.periodo.localeCompare(b.periodo));
  return rows;
}

export const handleAIAnalyze: RequestHandler = async (req, res) => {
  try {
    const { data, columns } = getCurrentData();
    if (!data || data.length === 0 || !columns || columns.length === 0) {
      return res
        .status(400)
        .json({ error: "No data loaded. Upload a file first." });
    }

    const question: string = req.body?.question || "";
    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Question is required" });
    }

    const n = guessN(question);
    const guesses = guessColumns(question, columns);

    const numericCols = columns.filter((c) => isNumericColumn(data, c));
    const dateCols = columns.filter((c) => isDateColumn(data, c));
    const catCols = columns.filter((c) => !numericCols.includes(c));

    // Choose defaults
    const groupBy = guesses.cliente || guesses.categoria || catCols[0];
    const valueField =
      guesses.valor && numericCols.includes(guesses.valor)
        ? guesses.valor
        : numericCols[0];

    // Detect if question is time-related
    const qn = normalize(question);
    const wantsTrend =
      /\b(tendencia|tend\u00eancia|evolucao|evolu\u00e7\u00e3o|por mes|por m\u00eas|mensal|anual|por ano|timeline|ao longo|mes a mes|m\u00eas a m\u00eas|year over year)\b/.test(
        qn,
      );

    let tableRows: any[] = [];
    let tableColumns: string[] = [];
    let labelKey = "categoria";
    let valueKey = "valor";
    let chartType: "bar" | "line" | "pie" = "bar";
    let chartExplanation = "";
    let interpretation = "";
    let sql = "";

    // Optional filtering by product or value after "de"/"do"/"da"
    let filter: { column: string; equals: string } | undefined;
    if (qn.includes(" de ") || qn.includes(" do ") || qn.includes(" da ")) {
      const after =
        qn
          .split(/\bde\b|\bdo\b|\bda\b/)
          .pop()
          ?.trim() || "";
      const token = after.split(/\s|\?|\.|,|!|;|:|\n/).filter(Boolean)[0];
      if (token) {
        // try to find a column with many matches for this token
        for (const c of catCols) {
          const has = data.some((r) => String(r[c]).toLowerCase() === token);
          if (has) {
            filter = { column: c, equals: token };
            break;
          }
        }
      }
    }

    if (wantsTrend && dateCols.length > 0) {
      const dateCol =
        guesses.data && dateCols.includes(guesses.data)
          ? guesses.data
          : dateCols[0];
      const unit: "month" | "year" = /ano|year|anual/.test(qn)
        ? "year"
        : "month";
      tableRows = timeSeriesCount(data, dateCol, unit);
      tableColumns = ["periodo", "valor"];
      labelKey = "periodo";
      valueKey = "valor";
      chartType = "line";
      chartExplanation =
        unit === "year"
          ? "S\u00e9rie temporal anual de ocorr\u00eancias"
          : "S\u00e9rie temporal mensal de ocorr\u00eancias";
      interpretation = `A pergunta foi interpretada como uma an\u00e1lise de tend\u00eancia ao longo do tempo usando a coluna '${dateCol}'.`;
      sql = `SELECT DATE_TRUNC('${unit}', TO_TIMESTAMP(${JSON.stringify(dateCol)})) AS periodo, COUNT(*) AS valor FROM tabela GROUP BY 1 ORDER BY 1`;
    } else {
      const wantsSum =
        /\b(somar|soma|faturamento|receita|valor total|totalizado)\b/.test(
          qn,
        ) && !!valueField;
      const wantsAvg = /\b(media|m\u00e9dia|avg)\b/.test(qn) && !!valueField;

      if (wantsSum && valueField) {
        tableRows = groupByAggregate(data, groupBy, valueField, "sum");
        interpretation = `A pergunta foi interpretada como soma de '${valueField}' por '${groupBy}'.`;
        sql = `SELECT ${groupBy} AS categoria, SUM(${valueField}) AS valor FROM tabela GROUP BY ${groupBy} ORDER BY valor DESC LIMIT ${n}`;
      } else if (wantsAvg && valueField) {
        tableRows = groupByAggregate(data, groupBy, valueField, "avg");
        interpretation = `A pergunta foi interpretada como m\u00e9dia de '${valueField}' por '${groupBy}'.`;
        sql = `SELECT ${groupBy} AS categoria, AVG(${valueField}) AS valor FROM tabela GROUP BY ${groupBy} ORDER BY valor DESC LIMIT ${n}`;
      } else {
        tableRows = groupByCount(data, groupBy, filter);
        interpretation = `A pergunta foi interpretada como contagem de registros por '${groupBy}'.`;
        sql = `SELECT ${groupBy} AS categoria, COUNT(*) AS valor FROM tabela GROUP BY ${groupBy} ORDER BY valor DESC LIMIT ${n}`;
      }

      tableRows = topN(tableRows, n);
      tableColumns = ["categoria", "valor"];
      labelKey = "categoria";
      valueKey = "valor";
      chartType = "bar";
      chartExplanation =
        "Gr\u00e1fico de barras permite compara\u00e7\u00e3o f\u00e1cil entre categorias.";
    }

    // Narrative generation (deterministic)
    const top = tableRows[0];
    const second = tableRows[1];
    const names = tableRows
      .slice(0, Math.min(3, tableRows.length))
      .map((r) => `${r[labelKey]} (${r[valueKey]})`)
      .join(", ");
    const summary =
      tableRows.length > 0
        ? `Os principais resultados s\u00e3o ${names}.`
        : "N\u00e3o h\u00e1 dados suficientes para gerar um resumo.";

    const insights: string[] = [];
    if (top && second) {
      const diff = top[valueKey] - second[valueKey];
      if (diff > 0)
        insights.push(
          `${top[labelKey]} supera ${second[labelKey]} em ${diff} ${wantsTrend ? "ocorr\u00eancias" : "unidades"}.`,
        );
    }
    if (tableRows.length >= 5)
      insights.push(
        "H\u00e1 concentra\u00e7\u00e3o nos primeiros grupos, sugerindo curva de Pareto.",
      );

    const recommendations = [
      "Investigue as categorias com maior volume para oportunidades de otimiza\u00e7\u00e3o.",
      "Aplique segmenta\u00e7\u00f5es adicionais para entender padr\u00f5es escondidos.",
    ];

    const response = {
      interpretation,
      operation: {
        type: chartType === "line" ? "time_series" : "group_by",
        groupBy: chartType === "line" ? undefined : groupBy,
        metricOp: "count",
        metricField: undefined,
        limit: n,
      },
      table: {
        columns: tableColumns,
        rows: tableRows,
        labelColumn: labelKey,
        valueColumn: valueKey,
      },
      chart: {
        type: chartType,
        xKey: labelKey,
        yKey: valueKey,
        explanation: chartExplanation,
      },
      sql,
      analysis: {
        summary,
        insights,
        patterns: [],
        recommendations,
      },
      provider: process.env.OPENAI_API_KEY
        ? "heuristic+openai-optional"
        : "heuristic",
    } as const;

    return res.json(response);
  } catch (error) {
    console.error("AI analyze error:", error);
    res.status(500).json({ error: "Failed to analyze question" });
  }
};
