import React, { useState } from 'react';
import { Database, Table, Key, Copy, Check, Link2, Code } from 'lucide-react';
import { DATABASE_SCHEMA_TABLES } from '../../data/architectureData';

export const SchemaVisualizer: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string>('tracks');
  const [copied, setCopied] = useState<boolean>(false);

  const activeTable = DATABASE_SCHEMA_TABLES.find((t) => t.name === selectedTable) || DATABASE_SCHEMA_TABLES[0];

  const generateSQL = (table: typeof activeTable) => {
    const cols = table.columns
      .map((c) => `  ${c.name} ${c.type}${c.pk ? ' PRIMARY KEY' : ''}`)
      .join(',\n');
    return `CREATE TABLE ${table.name} (\n${cols}\n);`;
  };

  const copySQL = () => {
    const sql = generateSQL(activeTable);
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm transition-colors text-slate-900 dark:text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
            <Database className="w-5 h-5" />
            <span className="text-base text-slate-900 dark:text-slate-100">Relational Database Schema & Entity Relationships</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            PostgreSQL relational architecture with Drizzle ORM mapping, Row-Level Security, and GIN search indices.
          </p>
        </div>

        <button
          type="button"
          onClick={copySQL}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-mono rounded-lg transition border border-slate-300 dark:border-slate-700 self-start md:self-auto shadow-xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied DDL' : 'Copy SQL DDL'}</span>
        </button>
      </div>

      {/* Table Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-4 border-b border-slate-200 dark:border-slate-800/60 scrollbar-none">
        {DATABASE_SCHEMA_TABLES.map((tbl) => (
          <button
            key={tbl.name}
            type="button"
            onClick={() => setSelectedTable(tbl.name)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium shrink-0 transition flex items-center gap-1.5 ${
              selectedTable === tbl.name
                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-500/40 font-semibold'
                : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Table className="w-3.5 h-3.5 opacity-70" />
            <span>{tbl.name}</span>
          </button>
        ))}
      </div>

      {/* Table Detail */}
      <div className="mt-6 space-y-4">
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-400">{activeTable.name}</h4>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                PostgreSQL Table
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{activeTable.description}</p>
          </div>
          <div className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 self-start md:self-auto shadow-xs">
            {activeTable.columns.length} columns defined
          </div>
        </div>

        {/* Columns Grid */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-900/60">
                <th className="py-2.5 px-4">Column Name</th>
                <th className="py-2.5 px-4">Data Type</th>
                <th className="py-2.5 px-4">Key / Constraint</th>
                <th className="py-2.5 px-4">Notes & Relations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
              {activeTable.columns.map((col) => (
                <tr key={col.name} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                    {col.pk && <Key className="w-3 h-3 text-amber-500 dark:text-amber-400 shrink-0" />}
                    <span>{col.name}</span>
                  </td>
                  <td className="py-2.5 px-4 text-emerald-700 dark:text-emerald-400 font-medium">{col.type}</td>
                  <td className="py-2.5 px-4">
                    {col.pk ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold">
                        PRIMARY KEY
                      </span>
                    ) : col.type.includes('FK') ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-800 dark:text-blue-300 font-semibold flex items-center gap-1 w-fit">
                        <Link2 className="w-2.5 h-2.5" />
                        FOREIGN KEY
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-600 dark:text-slate-400">{col.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
