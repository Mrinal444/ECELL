'use client';

export default function DownloadCsvButton({ contestId }: { contestId: string }) {
  const handleDownload = () => {
    window.open(`/api/contests/${contestId}/csv`, '_blank');
  };

  return (
    <button
      onClick={handleDownload}
      className="bg-vault-copper text-white px-4 py-2 rounded-md font-medium hover:bg-vault-copper-dark transition shadow-sm"
    >
      Export CSV
    </button>
  );
}
