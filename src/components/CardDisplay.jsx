export default function CardDisplay({ card }) {
  if (!card) return null;
  return (
    <div className="text-center p-4">
      <img src={card.image} alt={card.name} className="w-48 mx-auto mb-2" />
      <h2 className="text-xl font-bold">{card.name} {card.direction}</h2>
      <p className="text-sm text-gray-600">{card.meaning}</p>
    </div>
  );
}
