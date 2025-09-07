import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Loader2, ChartBar, Database, Code } from "lucide-react";
import { toast } from "sonner";

interface AIResponse {
  interpretation: string;
  operation: any;
  table: { columns: string[]; rows: any[]; labelColumn: string; valueColumn: string };
  chart: { type: "bar" | "line" | "pie"; xKey: string; yKey: string; explanation: string };
  sql: string;
  analysis: { summary: string; insights: string[]; patterns: string[]; recommendations: string[] };
  provider: string;
}

export default function AIInsights() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Request failed");
      }
      const data: AIResponse = await res.json();
      setResult(data);
    } catch (e: any) {
      toast.error(e.message || "Falha ao consultar a IA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Faça sua Pergunta</CardTitle>
          <CardDescription>Pergunte sobre seus dados em linguagem natural. Ex.: "traga os 3 clientes com mais processos em 2025"</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Digite sua pergunta..." rows={3} />
          <Button onClick={ask} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChartBar className="h-4 w-4" />}
            Consultar e Analisar
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6 animate-in fade-in-50 duration-500">
          <Card>
            <CardHeader>
              <CardTitle>Análise Inteligente dos Dados</CardTitle>
              <CardDescription>Resumo Executivo e Insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed">{result.analysis.summary}</p>
              {result.analysis.insights.length > 0 && (
                <div>
                  <p className="font-medium mb-1">Principais Insights:</p>
                  <ul className="list-disc pl-6 text-sm space-y-1">
                    {result.analysis.insights.map((i, idx) => (
                      <li key={idx}>{i}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.analysis.recommendations.length > 0 && (
                <div>
                  <p className="font-medium mb-1">Recomendações:</p>
                  <ul className="list-disc pl-6 text-sm space-y-1">
                    {result.analysis.recommendations.map((i, idx) => (
                      <li key={idx}>{i}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="data" className="w-full">
            <TabsList>
              <TabsTrigger value="data"><Database className="h-3.5 w-3.5 mr-1" />Dados</TabsTrigger>
              <TabsTrigger value="chart"><ChartBar className="h-3.5 w-3.5 mr-1" />Gráfico</TabsTrigger>
              <TabsTrigger value="sql"><Code className="h-3.5 w-3.5 mr-1" />SQL</TabsTrigger>
            </TabsList>
            <TabsContent value="data">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Resultados ({result.table.rows.length} registros)</CardTitle>
                  <CardDescription>Ordenados por {result.table.valueColumn} desc</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {result.table.columns.map((c) => (
                            <TableHead key={c} className="whitespace-nowrap">{c.toUpperCase()}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.table.rows.map((r, i) => (
                          <TableRow key={i}>
                            {result.table.columns.map((c) => (
                              <TableCell key={c} className="whitespace-nowrap">{String((r as any)[c])}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="chart">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Visualização - {result.chart.type.toUpperCase()}</CardTitle>
                  <CardDescription>{result.chart.explanation}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-[320px]">
                    {result.chart.type === "bar" && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={result.table.rows}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey={result.chart.xKey} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey={result.chart.yKey} fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    {result.chart.type === "line" && (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={result.table.rows}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey={result.chart.xKey} />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey={result.chart.yKey} stroke="#8884d8" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="sql">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Detalhes Técnicos</CardTitle>
                  <CardDescription>Como interpretei sua pergunta e a SQL gerada</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm"><span className="font-medium">Interpretação:</span> {result.interpretation}</p>
                  </div>
                  <pre className="rounded bg-muted p-3 text-xs overflow-auto"><code>{result.sql}</code></pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
