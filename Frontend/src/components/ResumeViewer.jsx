import { fileUrl } from "../api";

export default function ResumeViewer({ path }) {
  if (!path) return null;
  const url = fileUrl(path);
  const isPdf = url.toLowerCase().endsWith(".pdf");
  return (
    <div className="border rounded-xl p-3 bg-white">
      {isPdf ? (
        <iframe title="Resume" src={url} className="w-full h-96 rounded" />
      ) : (
        <a className="text-blue-600 underline" href={url} target="_blank" rel="noreferrer">
          Download Resume
        </a>
      )}
    </div>
  );
}
