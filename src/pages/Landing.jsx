import React from 'react'
import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
        EQA Result Analysis
      </h1>
      <a
        href="/template.csv"
        download
        className="text-blue-500 underline mb-4"
      >
        Download template CSV
      </a>
      <Link
        to="/upload"
        className="px-4 py-2 bg-indigo-600 text-white rounded shadow"
      >
        Start Analysis
      </Link>
      <p className="mt-8 text-center max-w-prose">
        Upload CSV or XLSX result files to compare device performance and
        identify outliers. All processing occurs locally in your browser.
      </p>
    </div>
  )
}
