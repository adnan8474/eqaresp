import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

function stats(values) {
  const n = values.length
  const mean = values.reduce((a, b) => a + Number(b), 0) / n
  const sd = Math.sqrt(values.reduce((a, b) => a + Math.pow(Number(b) - mean, 2), 0) / (n - 1 || 1))
  const cv = (sd / mean) * 100
  return { n, mean, sd, cv }
}

export default function Analysis() {
  const raw = JSON.parse(localStorage.getItem('rawData') || '[]')
  const [test, setTest] = useState('')

  const tests = useMemo(() => [...new Set(raw.map(r => r['Test Name']))], [raw])

  const grouped = useMemo(() => {
    const result = {}
    raw.filter(r => !test || r['Test Name'] === test).forEach(r => {
      const id = r['Device ID']
      result[id] = result[id] || []
      result[id].push(r)
    })
    return result
  }, [raw, test])

  const deviceStats = useMemo(() => {
    const out = {}
    Object.entries(grouped).forEach(([id, rows]) => {
      const values = rows.map(r => Number(r.Result))
      out[id] = stats(values)
    })
    return out
  }, [grouped])

  const chartData = useMemo(() => {
    return {
      labels: raw.map(r => r.Date),
      datasets: Object.entries(grouped).map(([id, rows], idx) => ({
        label: id,
        data: rows.map(r => r.Result),
        borderColor: `hsl(${idx * 60},70%,50%)`,
        backgroundColor: 'transparent',
      })),
    }
  }, [grouped, raw])

  function downloadXlsx() {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(raw)
    XLSX.utils.book_append_sheet(wb, ws, 'Raw')
    XLSX.writeFile(wb, 'report.xlsx')
  }

  function downloadPdf() {
    const doc = new jsPDF()
    doc.text('EQA Result Analysis', 10, 10)
    doc.save('report.pdf')
  }

  return (
    <div className="p-4 space-y-4">
      <Link to="/upload" className="text-blue-500 underline">
        Back
      </Link>
      <div>
        <label className="mr-2">Test:</label>
        <select value={test} onChange={e => setTest(e.target.value)}>
          <option value="">All</option>
          {tests.map(t => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="table-auto text-sm">
          <thead>
            <tr>
              <th className="px-2">Device</th>
              <th className="px-2">Count</th>
              <th className="px-2">Mean</th>
              <th className="px-2">SD</th>
              <th className="px-2">CV%</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(deviceStats).map(([id, s]) => (
              <tr key={id} className={s.cv > 5 ? 'text-red-600' : ''}>
                <td className="border px-2">{id}</td>
                <td className="border px-2">{s.n}</td>
                <td className="border px-2">{s.mean.toFixed(2)}</td>
                <td className="border px-2">{s.sd.toFixed(2)}</td>
                <td className="border px-2">{s.cv.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Line data={chartData} />
      <div className="space-x-4">
        <button onClick={downloadPdf} className="px-3 py-1 bg-indigo-600 text-white rounded">
          Download PDF
        </button>
        <button onClick={downloadXlsx} className="px-3 py-1 bg-green-600 text-white rounded">
          Download XLSX
        </button>
      </div>
    </div>
  )
}
