export default function Timeline({ items = [] }) {
  return (
    <ol className="relative border-s mt-2 border-gray-200">
      {items.map((i, idx) => (
        <li key={idx} className="mb-6 ms-4">
          <div className="absolute w-3 h-3 bg-red-500 rounded-full mt-1.5 -start-1.5 border"></div>
          <time className="mb-1 text-xs text-gray-500 block">{new Date(i.at).toLocaleString()}</time>
          <h3 className="text-sm font-semibold capitalize">{i.code.replaceAll("-", " ")}</h3>
          {i.note && <p className="text-sm text-gray-600">{i.note}</p>}
        </li>
      ))}
    </ol>
  );
}