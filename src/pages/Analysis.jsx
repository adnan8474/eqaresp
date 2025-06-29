import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import {
  BoxPlotController,
  BoxAndWhiskers
} from 'chartjs-chart-box-and-violin-plot'
import { Line, Chart } from 'react-chartjs-2'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  BoxPlotController,
  BoxAndWhiskers
)

function calcStats(values) {
  const nums = values.map(v => Number(v))
  const n = nums.length
  const mean = nums.reduce((a, b) => a + b, 0) / n
  let sd = NaN
  let cv = NaN
  if (n > 1) {
    const variance = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1)
    sd = Math.sqrt(variance)
    cv = (sd / mean) * 100
  }
  return { n, mean, sd, cv }
}

export default function Analysis() {
  const raw = JSON.parse(localStorage.getItem('rawData') || '[]')
  const [test, setTest] = useState('')

  const tests = useMemo(() => [...new Set(raw.map(r => r['Test Name']))], [raw])

  const filtered = useMemo(
    () => raw.filter(r => !test || r['Test Name'] === test),
    [raw, test]
  )

  const grouped = useMemo(() => {
    const result = {}
    filtered.forEach(r => {
      const id = r['Device ID']
      result[id] = result[id] || []
      result[id].push(r)
    })
    return result
  }, [filtered])

  const deviceStats = useMemo(() => {
    const out = {}
    Object.entries(grouped).forEach(([id, rows]) => {
      const values = rows.map(r => r.Result)
      out[id] = calcStats(values)
    })
    return out
  }, [grouped])

  const peerStats = useMemo(() => {
    const vals = filtered.map(r => r.Result)
    return calcStats(vals)
  }, [filtered])

  const deviationRows = useMemo(() => {
    return filtered.map(r => {
      const value = Number(r.Result)
      const mean = peerStats.mean
      const sd = peerStats.sd
      let z = 0
      let dev = 0
      if (!Number.isNaN(sd) && sd !== 0) {
        z = (value - mean) / sd
        dev = ((value - mean) / mean) * 100
      }
      return { ...r, z, dev }
    })
  }, [filtered, peerStats])

  const dates = useMemo(
    () => [...new Set(filtered.map(r => r.Date))].sort(),
    [filtered]
  )

  const lineData = useMemo(() => {
    return {
      labels: dates,
      datasets: Object.entries(grouped).map(([id, rows], idx) => {
        const data = dates.map(d => {
          const row = rows.find(r => r.Date === d)
          return row ? Number(row.Result) : null
        })
        return {
          label: id,
          data,
          spanGaps: true,
          borderColor: `hsl(${(idx * 60) % 360},70%,50%)`,
          backgroundColor: 'transparent',
        }
      }),
    }
  }, [grouped, dates])

  const boxData = useMemo(() => {
    return {
      labels: Object.keys(grouped),
      datasets: [
        {
          label: test || 'Results',
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          data: Object.values(grouped).map(rows =>
            rows.map(r => Number(r.Result))
          ),
        },
      ],
    }
  }, [grouped, test])

  function downloadXlsx() {
    const wb = XLSX.utils.book_new()
    const wsRaw = XLSX.utils.json_to_sheet(raw)
    XLSX.utils.book_append_sheet(wb, wsRaw, 'Raw')
    const statsRows = Object.entries(deviceStats).map(([id, s]) => ({
      Device: id,
      Count: s.n,
      Mean: s.mean,
      SD: s.sd,
      CV: s.cv,
    }))
    const wsStats = XLSX.utils.json_to_sheet(statsRows)
    XLSX.utils.book_append_sheet(wb, wsStats, 'Stats')
    const wsDev = XLSX.utils.json_to_sheet(deviationRows)
    XLSX.utils.book_append_sheet(wb, wsDev, 'Deviation')
    XLSX.writeFile(wb, 'report.xlsx')
  }

  function downloadPdf() {
    const doc = new jsPDF()
    doc.text('EQA Result Analysis', 10, 10)
    let y = 20
    Object.entries(deviceStats).forEach(([id, s]) => {
      const text = `${id}: n=${s.n}, mean=${s.mean.toFixed(2)}, sd=${
        Number.isNaN(s.sd) ? '-' : s.sd.toFixed(2)
      }`
      doc.text(text, 10, y)
      y += 6
    })
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
        <table className="table-auto text-sm mb-4">
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
              <tr
                key={id}
                className={`${
                  s.n < 2 ? 'text-gray-400' : s.cv > 5 ? 'text-red-600' : ''
                }`}
              >
                <td className="border px-2">{id}</td>
                <td className="border px-2">{s.n}</td>
                <td className="border px-2">{s.mean.toFixed(2)}</td>
                <td className="border px-2">
                  {Number.isNaN(s.sd) ? '–' : s.sd.toFixed(2)}
                </td>
                <td className="border px-2">
                  {Number.isNaN(s.cv) ? '–' : `${s.cv.toFixed(2)}${s.cv > 5 ? ' ⚠' : ''}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Chart type="boxplot" data={boxData} />
      <Line data={lineData} />
      <div className="overflow-x-auto">
        <table className="table-auto text-sm">
          <thead>
            <tr>
              <th className="px-2">Date</th>
              <th className="px-2">Device</th>
              <th className="px-2">Result</th>
              <th className="px-2">Z-score</th>
              <th className="px-2">Deviation %</th>
            </tr>
          </thead>
          <tbody>
            {deviationRows.map((r, idx) => (
              <tr
                key={idx}
                className={Math.abs(r.z) > 2 ? 'text-red-600' : ''}
              >
                <td className="border px-2">{r.Date}</td>
                <td className="border px-2">{r['Device ID']}</td>
                <td className="border px-2">{r.Result}</td>
                <td className="border px-2">{r.z.toFixed(2)}</td>
                <td className="border px-2">{r.dev.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-x-4">
        <button
          onClick={downloadPdf}
          className="px-3 py-1 bg-indigo-600 text-white rounded"
        >
          Download PDF
        </button>
        <button
          onClick={downloadXlsx}
          className="px-3 py-1 bg-green-600 text-white rounded"
        >
          Download XLSX
        </button>
      </div>
    </div>
  )
}
