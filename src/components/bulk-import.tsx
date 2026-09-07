import { useMemo, useState } from "react";
import { Button, Caps, Field, Modal, Select, TextArea } from "@/components/ui-kit";
import { useStore } from "@/store/app-store";
import type { Priority } from "@/data/types";
import { cn } from "@/lib/utils";

const TEMPLATE = `name,folder,testing_type,priority,description
Create sales order with pricing,Order to Cash,Regression,High,Validate pricing condition on standard order
Post incoming payment,Record to Report,Functional,Medium,Clear open item against invoice`;

const PRIORITIES: Priority[] = ["Critical", "High", "Medium", "Low"];

type ParsedRow = {
  line: number;
  name: string;
  folder: string;
  folderId: string | null;
  testingType: string;
  priority: Priority;
  description: string;
  error: string | null;
};

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function BulkImportTestCases({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useStore();
  const [text, setText] = useState("");
  const [fallbackFolder, setFallbackFolder] = useState(store.folders[0]?.id ?? "f2");
  const [progress, setProgress] = useState<number | null>(null);
  const [done, setDone] = useState<number | null>(null);

  const rows = useMemo<ParsedRow[]>(() => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return [];
    const header = splitCsvLine(lines[0]!).map((h) => h.toLowerCase());
    const hasHeader = header.includes("name");
    const body = hasHeader ? lines.slice(1) : lines;
    const idx = (key: string, fallback: number) => (hasHeader ? header.indexOf(key) : fallback);
    const iName = idx("name", 0);
    const iFolder = idx("folder", 1);
    const iType = idx("testing_type", 2);
    const iPrio = idx("priority", 3);
    const iDesc = idx("description", 4);

    return body.map((line, i) => {
      const cells = splitCsvLine(line);
      const at = (n: number) => (n >= 0 ? (cells[n] ?? "") : "");
      const name = at(iName);
      const folderName = at(iFolder);
      const match = store.folders.find((f) => f.name.toLowerCase() === folderName.toLowerCase());
      const rawPriority = at(iPrio);
      const priority = (PRIORITIES.find((p) => p.toLowerCase() === rawPriority.toLowerCase()) ?? "Medium") as Priority;
      const duplicate = store.cases.some((c) => c.name.toLowerCase() === name.toLowerCase());
      const error = !name ? "Name is required" : duplicate ? "A case with this name already exists" : null;
      return {
        line: i + 1,
        name,
        folder: match ? match.name : folderName ? `${folderName} (not found)` : "Default folder",
        folderId: match?.id ?? null,
        testingType: at(iType) || "Regression",
        priority,
        description: at(iDesc),
        error,
      };
    });
  }, [text, store.folders, store.cases]);

  const valid = rows.filter((r) => !r.error);

  const runImport = async () => {
    setDone(null);
    for (let i = 0; i < valid.length; i++) {
      const r = valid[i]!;
      store.addTestCase({
        name: r.name,
        description: r.description,
        folderId: r.folderId ?? fallbackFolder,
        testingType: r.testingType,
        priority: r.priority,
      });
      setProgress(Math.round(((i + 1) / valid.length) * 100));
      await new Promise((res) => setTimeout(res, 25));
    }
    setProgress(null);
    setDone(valid.length);
    setText("");
  };

  return (
    <Modal open={open} onClose={onClose} title="Bulk import test cases" wide>
      <div className="space-y-3">
        <p className="text-[12px] text-muted-foreground">
          Paste rows from Excel or a CSV file, or choose a file. Columns: name, folder, testing_type, priority,
          description. Every row is validated before anything is written to the repository.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer rounded-md border border-border px-2.5 py-1.5 text-[12px] hover:bg-muted/70">
            Choose file
            <input
              type="file"
              accept=".csv,.txt,text/csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setText(await file.text());
              }}
            />
          </label>
          <Button variant="ghost" onClick={() => setText(TEMPLATE)}>
            Load sample
          </Button>
          <div className="ml-auto w-56">
            <Field label="Folder for unmatched rows">
              <Select value={fallbackFolder} onChange={(e) => setFallbackFolder(e.target.value)}>
                {store.folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </div>

        <Field label="CSV content">
          <TextArea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder={TEMPLATE} />
        </Field>

        {rows.length > 0 ? (
          <div className="rounded-lg border border-border">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <Caps>Validation preview</Caps>
              <span className="text-[11px] text-muted-foreground">
                {valid.length} ready · {rows.length - valid.length} with issues
              </span>
            </div>
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-[12px]">
                <thead className="bg-muted">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-3 py-1.5 font-medium">#</th>
                    <th className="px-3 py-1.5 font-medium">Name</th>
                    <th className="px-3 py-1.5 font-medium">Folder</th>
                    <th className="px-3 py-1.5 font-medium">Type</th>
                    <th className="px-3 py-1.5 font-medium">Priority</th>
                    <th className="px-3 py-1.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.line} className="border-t border-border">
                      <td className="px-3 py-1.5 font-mono text-[11px] text-muted-foreground">{r.line}</td>
                      <td className="px-3 py-1.5">{r.name || "—"}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{r.folder}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{r.testingType}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{r.priority}</td>
                      <td className={cn("px-3 py-1.5", r.error ? "text-destructive" : "text-pass")}>
                        {r.error ?? "Ready"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {progress !== null ? (
          <div>
            <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
              <span>Importing…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : null}

        {done !== null ? (
          <p className="text-[12px] text-pass">{done} test cases imported into the repository.</p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button disabled={valid.length === 0 || progress !== null} onClick={runImport}>
            {progress !== null ? "Importing…" : `Import ${valid.length} case${valid.length === 1 ? "" : "s"}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
