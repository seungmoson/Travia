import { Star, Heart } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState } from "react";

export function PropertyCard({
    image,
    title,
    location,
    distance,
    date,
    price,
    rating,
    guide,
}) {
    const [isFavorite, setIsFavorite] = useState(false);

    return (
        <div className="group cursor-pointer">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3">
                <ImageWithFallback
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsFavorite(!isFavorite);
                    }}
                    className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform"
                >
                    <Heart
                        className={`w-6 h-6 ${isFavorite ? "fill-rose-500 stroke-rose-500" : "stroke-white fill-black/20"
                            }`}
                    />
                </button>
            </div>
            <div className="space-y-1">
                <h3>{title}</h3>
                {guide && (
                    <p className="text-gray-500">가이드: {guide}</p>
                )}
                <p>
                    <span className="text-gray-900">{price.toLocaleString()}원</span>
                </p>
            </div>
        </div>
    );
}
