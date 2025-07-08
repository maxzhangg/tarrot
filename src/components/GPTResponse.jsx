export default function GPTResponse({ content }) {
  if (!content) return null;
  return (
    <div className="bg-gray-100 p-4 rounded mt-4 whitespace-pre-wrap">{content}</div>
  );
}
